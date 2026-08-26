"use client";

import { PencilLine } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "@/lib/toast";

export function ProductDetailActions({ productName }: { productName: string }) {
  return (
    <Button
      variant="outline"
      onClick={() =>
        toast.info(`Editing ${productName} will be available once the inventory API is connected`)
      }
    >
      <PencilLine data-icon="inline-start" />
      Edit
    </Button>
  );
}
