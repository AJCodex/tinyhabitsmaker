import { Component } from 'react'

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { err: null }
  }

  static getDerivedStateFromError(err) {
    return { err }
  }

  componentDidCatch(err, info) {
    console.error('UI crashed:', err, info)
  }

  render() {
    if (!this.state.err) return this.props.children
    return (
      <div className="mx-auto mt-20 max-w-md rounded-3xl bg-white p-8 text-center shadow-soft">
        <div className="text-5xl">😬</div>
        <h2 className="mt-3 text-xl font-bold text-gray-800">Something broke</h2>
        <p className="mt-2 break-words text-sm text-gray-500">
          {this.state.err.message || String(this.state.err)}
        </p>
        <button
          onClick={() => location.reload()}
          className="mt-5 rounded-2xl bg-gradient-to-r from-brand-500 to-purple-600 px-5 py-2 font-bold text-white shadow-md"
        >
          Reload
        </button>
      </div>
    )
  }
}
