import { Component } from 'react';
import { FaExclamationTriangle } from 'react-icons/fa';
import Button from './Button';

class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary caught:', error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-[60vh] flex items-center justify-center px-4">
          <div className="text-center max-w-md">
            <FaExclamationTriangle className="mx-auto text-4xl text-orange-500 mb-4" />
            <h2 className="text-xl font-bold text-gray-900 mb-2">
              {this.props.title || 'Something went wrong'}
            </h2>
            <p className="text-sm text-gray-500 mb-6">
              {this.state.error?.message || 'An unexpected error occurred. Please try again.'}
            </p>
            <div className="flex items-center justify-center gap-3">
              {this.props.showHome !== false && (
                <Button to="/" variant="primary">
                  Go home
                </Button>
              )}
              <Button onClick={() => window.location.reload()} variant="secondary">
                Reload page
              </Button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
