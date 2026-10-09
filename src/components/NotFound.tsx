import { Link } from 'react-router-dom';
import { EmptyState } from './EmptyState';

export function NotFound({ message = 'The page you are looking for does not exist.' }) {
  return (
    <EmptyState
      title="Page not found"
      message={message}
      action={
        <Link to="/" className="button">
          Browse homes
        </Link>
      }
    />
  );
}
