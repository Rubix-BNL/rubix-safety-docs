"use client";

import React, { Component, ErrorInfo, ReactNode } from "react";
import { isAuthError, handleAuthError } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class AuthErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    console.error("AuthErrorBoundary caught an error:", error, errorInfo);

    // Handle auth-specific errors
    if (isAuthError(error)) {
      handleAuthError(error);
    }
  }

  handleReload = (): void => {
    if (typeof window !== "undefined") {
      window.location.reload();
    }
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4">
          <div className="max-w-md w-full">
            <div className="text-center mb-8">
              <img
                src="/RUBIX_logo_blue.svg"
                alt="Rubix"
                className="h-[40px] w-auto mx-auto mb-4"
              />
              <h2 className="text-2xl font-bold text-[#051e50] mb-2">
                Er is iets misgegaan
              </h2>
              <p className="text-sm text-gray-600">
                Er is een fout opgetreden. Probeer de pagina opnieuw te laden.
              </p>
            </div>

            <Card className="p-6">
              <div className="space-y-4">
                {this.state.error && (
                  <div className="bg-red-50 border border-red-200 rounded-md p-3">
                    <p className="text-sm text-red-800">
                      <strong>Fout:</strong> Authenticatie sessie verlopen
                    </p>
                  </div>
                )}

                <Button
                  onClick={this.handleReload}
                  className="w-full bg-[#051e50] hover:bg-[#051e50]/90 text-white font-medium"
                >
                  Pagina opnieuw laden
                </Button>

                <div className="text-center">
                  <Button
                    onClick={() => {
                      this.setState({ hasError: false, error: undefined });
                    }}
                    variant="outline"
                    className="text-sm"
                  >
                    Probeer opnieuw
                  </Button>
                </div>
              </div>
            </Card>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
