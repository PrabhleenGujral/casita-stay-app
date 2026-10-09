import type { RouteObject } from 'react-router-dom';
import { Layout } from './Layout';
import { RouteError } from './RouteError';
import { SearchPage } from '../features/search/SearchPage';
import { NotFound } from '../components/NotFound';

export const routes: RouteObject[] = [
  {
    element: <Layout />,
    errorElement: <RouteError />,
    children: [
      { index: true, element: <SearchPage /> },
      {
        path: 'listings/:id',
        lazy: async () => {
          const { ListingPage } = await import('../features/listing/ListingPage');
          return { Component: ListingPage };
        },
      },
      {
        path: 'bookings/:id',
        lazy: async () => {
          const { ConfirmationPage } = await import('../features/booking/ConfirmationPage');
          return { Component: ConfirmationPage };
        },
      },
      {
        path: 'saved',
        lazy: async () => {
          const { SavedPage } = await import('../features/favourites/SavedPage');
          return { Component: SavedPage };
        },
      },
      { path: '*', element: <NotFound /> },
    ],
  },
];
