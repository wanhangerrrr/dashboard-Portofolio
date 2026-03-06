import type { NextApiRequest, NextApiResponse } from "next";

type Day = { date: string; contributionCount: number; color: string };
type Week = { contributionDays: Day[] };

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") return res.status(405).end();

  const token = process.env.GITHUB_TOKEN;
  const username = process.env.GITHUB_USERNAME;
  const { range } = req.query;

  if (!token) return res.status(500).json({ error: "Missing GITHUB_TOKEN" });
  if (!username) return res.status(500).json({ error: "Missing GITHUB_USERNAME" });

  try {
    // If range=all, we need to fetch all years or at least the total count
    if (range === "all") {
      // First, get all contribution years
      const yearsQuery = `
        query($login: String!) {
          user(login: $login) {
            contributionsCollection {
              contributionYears
            }
          }
        }
      `;

      const yearsResponse = await fetch("https://api.github.com/graphql", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          query: yearsQuery,
          variables: { login: username },
        }),
      });

      const yearsJson = await yearsResponse.json();
      const years: number[] = yearsJson.data?.user?.contributionsCollection?.contributionYears ?? [];

      // Fetch the most recent year's calendar for the heatmap
      // but also calculate the total sum across all years
      let totalContributions = 0;
      let heatmapCal = null;

      // We'll fetch all totals in parallel
      const totalsPromises = years.map(year => {
        const from = `${year}-01-01T00:00:00Z`;
        const to = `${year}-12-31T23:59:59Z`;
        const q = `
          query($login: String!, $from: DateTime!, $to: DateTime!) {
            user(login: $login) {
              contributionsCollection(from: $from, to: $to) {
                contributionCalendar {
                  totalContributions
                  weeks {
                    contributionDays {
                      date
                      contributionCount
                      color
                    }
                  }
                }
              }
            }
          }
        `;
        return fetch("https://api.github.com/graphql", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            query: q,
            variables: { login: username, from, to },
          }),
        }).then(r => r.json());
      });

      const results = await Promise.all(totalsPromises);
      results.forEach((res, index) => {
        const count = res.data?.user?.contributionsCollection?.contributionCalendar?.totalContributions ?? 0;
        totalContributions += count;
        // Heatmap should be from the most recent year
        if (index === 0) {
          heatmapCal = res.data.user.contributionsCollection.contributionCalendar;
        }
      });

      if (!heatmapCal) throw new Error("Could not fetch heatmap data");

      return res.status(200).json({
        ...(heatmapCal as object),
        totalContributions, // Overwrite with absolute total
      });
    }

    // Default: Last 365 days
    const to = new Date();
    const from = new Date();
    from.setDate(to.getDate() - 365);

    const query = `
      query($login: String!, $from: DateTime!, $to: DateTime!) {
        user(login: $login) {
          contributionsCollection(from: $from, to: $to) {
            contributionCalendar {
              totalContributions
              weeks {
                contributionDays {
                  date
                  contributionCount
                  color
                }
              }
            }
          }
        }
      }
    `;

    const r = await fetch("https://api.github.com/graphql", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        query,
        variables: { login: username, from: from.toISOString(), to: to.toISOString() },
      }),
    });

    const json = await r.json();

    if (!r.ok || json.errors) {
      return res.status(500).json({ error: "GitHub GraphQL error", details: json.errors ?? json });
    }

    const cal = json.data.user.contributionsCollection.contributionCalendar as {
      totalContributions: number;
      weeks: Week[];
    };

    return res.status(200).json(cal);
  } catch (err: any) {
    return res.status(500).json({ error: "Server error", detail: err.message });
  }
}
