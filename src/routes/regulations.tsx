import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { PageHero, PageShell } from "@/components/site/page-shell";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/regulations")({
  head: () => ({
    meta: [
      { title: "Flight Compensation Regulations We Cover — JetClaim" },
      { name: "description", content: "Compare EU261, UK261, US DOT, Canada APPR, India DGCA, Brazil ANAC, the Montreal Convention and Turkey SHY passenger rights." },
      { property: "og:title", content: "Flight Compensation Regulations" },
      { property: "og:description", content: "Trigger conditions and compensation amounts across eight passenger-rights regimes." },
    ],
  }),
  component: Regulations,
});

function Regulations() {
  const { data: regulations = [] } = useQuery({
    queryKey: ["regulations"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("regulations")
        .select("*")
        .order("sort_order");
      if (error) throw error;
      return data;
    },
  });

  return (
    <PageShell>
      <PageHero title="Regulations" subtitle="The passenger-rights frameworks JetClaim works with every day." />
      <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
        <div className="overflow-x-auto rounded-xl border border-border">
          <Table>
            <TableHeader>
              <TableRow className="bg-surface">
                <TableHead>Regulation</TableHead>
                <TableHead>Region</TableHead>
                <TableHead>Compensation</TableHead>
                <TableHead>Triggers</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {regulations.map((reg) => (
                <TableRow key={reg.id}>
                  <TableCell className="font-semibold text-navy">
                    {reg.code}
                    <span className="block text-xs font-normal text-muted-foreground">{reg.name}</span>
                  </TableCell>
                  <TableCell>{reg.region}</TableCell>
                  <TableCell className="font-medium text-brand-blue">{reg.max_compensation}</TableCell>
                  <TableCell className="max-w-md text-sm text-muted-foreground">
                    {reg.trigger_conditions}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </section>
    </PageShell>
  );
}
