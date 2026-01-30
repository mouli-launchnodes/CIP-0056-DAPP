"use client";

import { Button } from "@/components/ui/button";

export default function LogoutButton() {
  return (
    <Button variant="outline" asChild>
      <a href="/auth/logout">
        Log Out
      </a>
    </Button>
  );
}