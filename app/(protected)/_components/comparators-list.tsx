//@ts-nocheck

"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { MoreHorizontal } from "lucide-react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { toast } from "react-hot-toast";

const ITEMS_PER_PAGE = 10;

export const ComparatorsList = () => {
  const searchparams = useSearchParams()!;
  const page = Number(searchparams.get("page")) || 0;
  const [comparators, setComparators] = useState([]);
  const [hasMore, setHasMore] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedComparatorId, setSelectedComparatorId] = useState<number | null>(null);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const fetchComparators = async () => {
      const response = await fetch(`/api/comparators?page=${page}&limit=${ITEMS_PER_PAGE}`);
      const data = await response.json();
      setComparators(data.comparators);
      setHasMore(data.hasMore);
    };
    fetchComparators();
  }, [page]);

  const goToPreviousPage = () => {
    const params = new URLSearchParams(searchparams);
    params.set("page", (page - 1).toString());
    router.push(`${pathname}?${params.toString()}`);
  };

  const goToNextPage = () => {
    const params = new URLSearchParams(searchparams);
    params.set("page", (page + 1).toString());
    router.push(`${pathname}?${params.toString()}`);
  };

  const handleDeleteClick = (id: number) => {
    setSelectedComparatorId(id);
    setIsDialogOpen(true);
  };

  const handleDelete = async () => {
    try {
      if (selectedComparatorId === null) return;
      const response = await fetch(`/api/comparators?id=${selectedComparatorId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        toast.success("Le comparateur a été supprimé avec succès.");
        setComparators(comparators.filter((comparator) => comparator.id !== selectedComparatorId));
      } else {
        toast.error("Échec de la suppression du comparateur.");
        console.error("Failed to delete comparator");
      }
    } catch (error) {
      toast.error("Une erreur est survenue lors de la suppression.");
      console.error("Error deleting comparator:", error);
    } finally {
      setIsDialogOpen(false);
      setSelectedComparatorId(null);
    }
  };

  return (
    <div className="bg-white p-4">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Comparateurs</CardTitle>
            <CardDescription>Gérez vos comparateurs et consultez leurs détails.</CardDescription>
          </div>
          <Link href="/web/comparators/new">
            <Button>Créer un comparateur</Button>
          </Link>
        </div>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="hidden w-[100px] sm:table-cell">
                <span className="sr-only">Logo</span>
              </TableHead>
              <TableHead>Nom</TableHead>
              <TableHead className="hidden md:table-cell">Description</TableHead>
              <TableHead className="hidden md:table-cell">Créé le</TableHead>
              <TableHead>
                <span className="sr-only">Actions</span>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {comparators.map((comparator) => (
              <TableRow key={comparator.id} className="hover:bg-muted/10">
                <TableCell className="hidden sm:table-cell">
                  <Link href={`/web/comparators/${comparator.id}`}>
                    <ImageWithFallback
                      alt={`Logo de ${comparator.name}`}
                      className="aspect-square rounded-md object-contain"
                      height="64"
                      src={comparator.logo || "/placeholder.svg"}
                      width="64"
                      fallbackSrc="/placeholder.svg"
                    />
                  </Link>
                </TableCell>
                <TableCell className="font-medium">
                  <Link href={`/web/comparators/${comparator.id}`}>{comparator.name}</Link>
                </TableCell>
                <TableCell className="hidden md:table-cell">
                  <Link href={`/web/comparators/${comparator.id}`}>{comparator.description}</Link>
                </TableCell>
                <TableCell className="hidden md:table-cell">
                  <Link href={`/web/comparators/${comparator.id}`}>
                    {new Date(comparator.createdAt).toLocaleString()}
                  </Link>
                </TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button aria-haspopup="true" size="icon" variant="ghost">
                        <MoreHorizontal className="size-4" />
                        <span className="sr-only">Basculer le menu</span>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuLabel>Actions</DropdownMenuLabel>
                      <DropdownMenuItem>
                        <Link href={`/web/comparators/${comparator.id}/edit`}>Modifier</Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleDeleteClick(comparator.id)}>
                        Supprimer
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
      <Separator />
      <div className="flex flex-row justify-end p-4 align-middle gap-4">
        <div className="text-xs text-muted-foreground">
          Affichage de <strong>{ITEMS_PER_PAGE * page + 1}</strong> à{" "}
          <strong>{ITEMS_PER_PAGE * (page + 1)}</strong> comparateurs
        </div>
        <div className="flex space-x-2">
          <Button
            className="h-8 w-8 rounded-full bg-gray-200 text-black"
            disabled={page === 0}
            onClick={goToPreviousPage}
          >
            {"<"}
          </Button>
          <Button
            className="h-8 w-8 rounded-full bg-gray-200 text-black"
            disabled={!hasMore}
            onClick={goToNextPage}
          >
            {">"}
          </Button>
        </div>
      </div>

      {/* Confirmation Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmer la suppression</DialogTitle>
          </DialogHeader>
          <p>Êtes-vous sûr de vouloir supprimer ce comparateur ? Cette action est irréversible.</p>
          <DialogFooter>
            <Button variant="secondary" onClick={() => setIsDialogOpen(false)}>
              Annuler
            </Button>
            <Button variant="destructive" onClick={handleDelete}>
              Supprimer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

// Helper component to handle image fallback
const ImageWithFallback = ({
  src,
  alt,
  fallbackSrc,
  ...props
}: {
  src: string;
  alt: string;
  fallbackSrc: string;
  [x: string]: any;
}) => {
  const [imgSrc, setImgSrc] = useState(src);

  return <Image {...props} src={imgSrc} alt={alt} onError={() => setImgSrc(fallbackSrc)} />;
};
