
import Link from "next/link";
import type { Project } from "@/lib/types";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
  } from "@/components/ui/alert-dialog"
import { ArrowRight, BookOpen, Trash2 } from "lucide-react";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { useSubscription } from "@/hooks/use-subscription";
import { useToast } from "@/hooks/use-toast";

interface ProjectCardProps {
  project: Project;
  deleteProject: (id: string) => void;
}

export function ProjectCard({ project, deleteProject }: ProjectCardProps) {
  const { hasProAccess } = useSubscription();
  const { toast } = useToast();
  const isPro = hasProAccess;

  const handleDelete = () => {
    if (!isPro) {
      toast({
        variant: "destructive",
        title: "Pro Feature",
        description: "Only Pro users can delete projects. Upgrade to Pro to unlock this feature.",
      });
      return;
    }
    deleteProject(project.id);
  };

  return (
    <Card className="h-full flex flex-col overflow-hidden transition-all duration-300 ease-in-out hover:shadow-lg hover:border-primary/50 bg-card/80 group">
      <CardHeader>
        <div className="flex justify-between items-start">
            <CardTitle className="font-headline text-lg mb-2">{project.title}</CardTitle>
            <AlertDialog>
                <AlertDialogTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0 opacity-50 hover:opacity-100 transition-opacity">
                        <Trash2 className="h-4 w-4" />
                    </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                    <AlertDialogHeader>
                    <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                    <AlertDialogDescription>
                        This action cannot be undone. This will permanently delete your project
                        and remove your data from our servers.
                    </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={handleDelete} disabled={!isPro}>
                        Continue
                    </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
         <div className="flex flex-wrap gap-2">
            {project.tags?.map(tag => (
                <Badge key={tag} variant="secondary" className="font-normal">{tag}</Badge>
            ))}
         </div>
      </CardHeader>
      <CardContent className="flex-1">
        <CardDescription className="line-clamp-3">{project.description}</CardDescription>
      </CardContent>
      <CardFooter>
          <Button asChild variant="secondary" className="w-full">
              <Link href={`/projects/${project.id}`}>
                Start Project <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1"/>
              </Link>
          </Button>
      </CardFooter>
    </Card>
  );
}
