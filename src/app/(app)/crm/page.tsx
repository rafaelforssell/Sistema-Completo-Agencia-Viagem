"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { PageHeader } from "@/components/common/page-header";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { InteracaoTimeline } from "@/components/crm/interacao-timeline";
import { LeadKanban } from "@/components/crm/lead-kanban";
import { TarefaList } from "@/components/crm/tarefa-list";

export default function CrmPage() {
  const [aba, setAba] = useState("funil");
  const [novoLead, setNovoLead] = useState(false);

  return (
    <div className="space-y-6">
      <PageHeader
        title="CRM"
        description="Funil de leads, histórico de interações e tarefas de follow-up."
      />

      <Tabs value={aba} onValueChange={setAba}>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <TabsList>
            <TabsTrigger value="funil">Funil</TabsTrigger>
            <TabsTrigger value="timeline">Timeline</TabsTrigger>
            <TabsTrigger value="tarefas">Tarefas</TabsTrigger>
          </TabsList>
          {aba === "funil" && (
            <Button onClick={() => setNovoLead(true)}>
              <Plus className="h-4 w-4" />
              Novo lead
            </Button>
          )}
        </div>

        <TabsContent value="funil" className="pt-2">
          <LeadKanban novoLead={novoLead} onNovoLeadChange={setNovoLead} />
        </TabsContent>

        <TabsContent value="timeline" className="pt-2">
          <InteracaoTimeline />
        </TabsContent>

        <TabsContent value="tarefas" className="pt-2">
          <TarefaList />
        </TabsContent>
      </Tabs>
    </div>
  );
}
