"use client";

import { PageHeader } from "@/components/common/page-header";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { InteracaoTimeline } from "@/components/crm/interacao-timeline";
import { LeadKanban } from "@/components/crm/lead-kanban";
import { TarefaList } from "@/components/crm/tarefa-list";

export default function CrmPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="CRM"
        description="Funil de leads, histórico de interações e tarefas de follow-up."
      />

      <Tabs defaultValue="funil">
        <TabsList>
          <TabsTrigger value="funil">Funil</TabsTrigger>
          <TabsTrigger value="timeline">Timeline</TabsTrigger>
          <TabsTrigger value="tarefas">Tarefas</TabsTrigger>
        </TabsList>

        <TabsContent value="funil" className="pt-4">
          <LeadKanban />
        </TabsContent>

        <TabsContent value="timeline" className="pt-4">
          <InteracaoTimeline />
        </TabsContent>

        <TabsContent value="tarefas" className="pt-4">
          <TarefaList />
        </TabsContent>
      </Tabs>
    </div>
  );
}
