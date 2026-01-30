import type { NextApiRequest, NextApiResponse } from "next";

type Day = { date: string; contributionCount: number; color: string };
type Week = { contributionDays: Day[] };

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") return res.status(405).end();

  const token = process.env.GITHUB_TOKEN;
  const username = process.env.GITHUB_USERNAME;

  if (!token) return res.status(500).json({ error: "Missing GITHUB_TOKEN" });
  if (!username) return res.status(500).json({ error: "Missing GITHUB_USERNAME" });

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
}
