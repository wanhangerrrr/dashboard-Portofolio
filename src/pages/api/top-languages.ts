import type { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const repo = 'wanhangerrrr/dashboard-Portofolio'; // Ganti dengan username dan nama repositori Anda
  const url = `https://api.github.com/repos/${repo}/languages`;

  const response = await fetch(url);
  if (!response.ok) {
    return res.status(response.status).json({ error: 'Failed to fetch data' });
  }

  const data = await response.json();
  res.status(200).json(data);
}