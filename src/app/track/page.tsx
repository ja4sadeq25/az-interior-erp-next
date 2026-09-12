import TrackClient from "./track-client";

export const metadata = { title: "Track your project · AZ Architects" };

export default async function TrackPage({ searchParams }: PageProps<"/track">) {
  const sp = await searchParams;
  const code = typeof sp.code === "string" ? sp.code : "";
  return <TrackClient initialCode={code} />;
}
