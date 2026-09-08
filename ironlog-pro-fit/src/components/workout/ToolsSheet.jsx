import React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import PlateCalculator from "./PlateCalculator";
import WarmupCalculator from "./WarmupCalculator";

export default function ToolsSheet({ open, onOpenChange, weight, barType, onBarTypeChange, gymProfileId }) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="border-white/10 bg-neutral-900 text-neutral-100">
        <DialogHeader>
          <DialogTitle className="font-light tracking-tight">Lifting tools</DialogTitle>
        </DialogHeader>
        <Tabs defaultValue="plates">
          <TabsList className="bg-neutral-800">
            <TabsTrigger value="plates">Plates</TabsTrigger>
            <TabsTrigger value="warmup">Warm-up</TabsTrigger>
          </TabsList>
          <TabsContent value="plates" className="pt-4">
            <PlateCalculator initialWeight={weight || 60} barType={barType} onBarTypeChange={onBarTypeChange} gymProfileId={gymProfileId} />
          </TabsContent>
          <TabsContent value="warmup" className="pt-4">
            <WarmupCalculator initialWeight={weight || 100} />
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}