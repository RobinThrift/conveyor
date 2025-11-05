import React from "react"

import { isEqual } from "@/lib/isEqual"
import { Alert } from "@/ui/components/Alert"

export type ErrorBoundaryProps = React.PropsWithChildren<{
    fallback?: React.ReactNode | ((error: Error, info: React.ErrorInfo) => React.ReactNode)
    resetOn: any[]
}>

type ErrorBoundaryState =
    | {
          didCatch: true
          error: Error
          info: React.ErrorInfo
      }
    | {
          didCatch: false
          error: null
          info: null
      }

const initState: ErrorBoundaryState = {
    didCatch: false,
    error: null,
    info: null,
}

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
    constructor(props: ErrorBoundaryProps) {
        super(props)
        this.state = initState
        this.reset = this.reset.bind(this)
    }

    static getDerivedStateFromError(error: Error) {
        return { didCatch: true, error }
    }

    componentDidCatch(error: Error, info: React.ErrorInfo) {
        this.setState({
            didCatch: true,
            error,
            info,
        })
    }

    private reset() {
        this.setState(initState)
    }

    componentDidUpdate(prevProps: ErrorBoundaryProps, prevState: ErrorBoundaryState) {
        if (!prevState.didCatch) {
            return
        }

        if (!isEqual(this.props.resetOn, prevProps.resetOn)) {
            this.reset()
        }
    }

    render() {
        if (!this.state.didCatch) {
            return this.props.children
        }

        let fallback = this.props.fallback || (
            <Alert variant="danger">
                {this.state.error.name}: {this.state.error.message}
                {this.state.error.stack && (
                    <pre>
                        <code>{this.state.error.stack}</code>
                    </pre>
                )}
                {this.state.info && (
                    <pre>
                        <code>{JSON.stringify(this.state.info, undefined, 4)}</code>
                    </pre>
                )}
            </Alert>
        )

        if (typeof fallback === "function") {
            return fallback(this.state.error, this.state.info)
        }

        return fallback
    }
}
