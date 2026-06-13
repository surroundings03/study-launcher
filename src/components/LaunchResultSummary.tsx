import type { LaunchResult } from '../shared/types';

type LaunchResultSummaryProps = {
  launchResults: LaunchResult[];
};

const sortLaunchResultsByOrder = (
  launchResults: LaunchResult[]
): LaunchResult[] =>
  [...launchResults].sort((firstResult, secondResult) => {
    if (firstResult.order !== secondResult.order) {
      return firstResult.order - secondResult.order;
    }

    return firstResult.title.localeCompare(secondResult.title);
  });

const formatOrder = (order: number): string => `[${order}]`;

export function LaunchResultSummary({
  launchResults
}: LaunchResultSummaryProps) {
  const openedResults = sortLaunchResultsByOrder(
    launchResults.filter((result) => result.success)
  );
  const failedResults = sortLaunchResultsByOrder(
    launchResults.filter((result) => !result.success)
  );

  if (openedResults.length === 0 && failedResults.length === 0) {
    return null;
  }

  return (
    <div className="launch-result-summary" role="status" aria-live="polite">
      {openedResults.length > 0 && (
        <section className="launch-result-group opened">
          <h3>Opened</h3>
          <ul>
            {openedResults.map((result) => (
              <li key={`${result.order}-${result.title}-opened`}>
                <span className="result-order">
                  {formatOrder(result.order)}
                </span>
                <span className="result-title" title={result.target}>
                  {result.title}
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}

      {failedResults.length > 0 && (
      <section className="launch-result-group failed">
        <h3>Failed</h3>
        <ul>
          {failedResults.map((result) => (
            <li key={`${result.order}-${result.title}-failed`}>
              <span className="result-order">
                {formatOrder(result.order)}
              </span>
              <span className="result-title" title={result.target}>
                {result.title}
              </span>
              <span className="result-error">{result.errorMessage}</span>
            </li>
          ))}
        </ul>
      </section>
      )}
    </div>
  );
}
