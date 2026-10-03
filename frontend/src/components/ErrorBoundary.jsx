import { Component } from 'react';

// If any page crashes while drawing, show this instead of a blank white screen
export default class ErrorBoundary extends Component {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  componentDidCatch(error) {
    console.error(error);
  }

  render() {
    if (this.state.failed) {
      return (
        <div role="alert" className="mx-auto max-w-md py-20 text-center">
          <h1 className="text-2xl font-bold">Something went wrong</h1>
          <p className="mt-2 text-gray-500">Please reload the page. If it keeps happening, try again later.</p>
          <a href="/" className="mt-4 inline-block rounded-lg bg-indigo-600 px-5 py-2 font-medium text-white hover:bg-indigo-700">
            Go to home
          </a>
        </div>
      );
    }
    return this.props.children;
  }
}