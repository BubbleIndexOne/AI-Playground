/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { AppProviders } from './app/providers';
import { AppRouter } from './app/router';
import { ErrorBoundary } from './shared/components/ErrorBoundary';

export default function App() {
  return (
    <ErrorBoundary>
      <AppProviders>
        <AppRouter />
      </AppProviders>
    </ErrorBoundary>
  );
}

