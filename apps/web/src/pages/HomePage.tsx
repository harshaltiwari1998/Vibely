import { Page, Placeholder } from "../components/Page";
import { APP_NAME } from "../brand";

export function HomePage() {
  return (
    <Page title={`Welcome to ${APP_NAME}`} description="Your 1-to-1 random video chat companion.">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <div className="card">Start a random match</div>
        <div className="card">Browse discoverable people</div>
        <div className="card">Check your wallet & gifts</div>
      </div>
      <Placeholder note="Home dashboard aggregation (matches, coins, notifications) lands in Part 2." />
    </Page>
  );
}
