import { Component } from 'react';

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {
    console.error('ErrorBoundary caught:', error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="text-center p-8 max-w-md">
            <div className="text-6xl mb-4">⚠️</div>
            <h2 className="text-2xl font-bold text-gray-800 mb-2">Có lỗi xảy ra</h2>
            <p className="text-gray-500 mb-6">Trang này gặp sự cố. Vui lòng thử lại.</p>
            <button
              onClick={() => { this.setState({ hasError: false }); window.location.href = '/'; }}
              className="bg-orange-500 text-white px-6 py-2 rounded-lg hover:bg-orange-600"
            >
              Về trang chủ
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
