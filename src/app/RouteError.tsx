import { isRouteErrorResponse, useRouteError } from 'react-router-dom';
import { ErrorState } from '../components/ErrorState';
import { NotFound } from '../components/NotFound';

//error defined
export function RouteError() {
  const error = useRouteError();

  if (isRouteErrorResponse(error) && error.status === 404) return <NotFound />;

  return (
    <main style={{ padding: '2rem 1rem' }}>
      <ErrorState
        title="Something went wrong"
        message="An unexpected error stopped this page from loading."
        onRetry={() => window.location.reload()}
        retryLabel="Reload page"
      />
    </main>
  );
}
