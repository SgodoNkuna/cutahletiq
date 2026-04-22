import { createFileRoute, Navigate } from "@tanstack/react-router";

export const Route = createFileRoute("/present")({
  component: () => <Navigate to="/" />,
});
