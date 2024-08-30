//@ts-nocheck

"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ChevronLeft, Database, FileText, Sheet } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import Image from "next/image";
import SelectDataSource from "./SelectDataSource";

export function ComparatorDetailPage({ comparator }) {
  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState(comparator?.name || "");
  const [description, setDescription] = useState(comparator?.description || "");
  const [color, setColor] = useState(comparator?.color || "#000000");
  const [imageSrc, setImageSrc] = useState(comparator?.logo || "/placeholder.svg");
  const [newLogo, setNewLogo] = useState<File | null>(null);
  const [showDataSource, setShowDataSource] = useState(false);
  const [sheets, setSheets] = useState<{ id: string; name: string }[]>([]); // Move sheets state here
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false); // State to manage loader

  useEffect(() => {
    checkAccessToken();
  }, []);

  const checkAccessToken = async () => {
    try {
      const response = await fetch("/api/google/check-token");
      const { hasToken } = await response.json();
      setShowDataSource(hasToken); // Automatically show data source if token exists
    } catch (error) {
      console.error("Error checking access token:", error);
    }
  };

  const toggleEditMode = () => {
    if (isEditing) {
      setName(comparator?.name || "");
      setDescription(comparator?.description || "");
      setColor(comparator?.color || "#000000");
      setImageSrc(comparator?.logo || "/placeholder.svg");
      setNewLogo(null);
    }
    setIsEditing(!isEditing);
  };

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) {
      setNewLogo(e.target.files[0]);
      setImageSrc(URL.createObjectURL(e.target.files[0]));
    }
  };

  const handleSave = async () => {
    try {
      let logoUrl = imageSrc;
      if (newLogo) {
        const formData = new FormData();
        formData.append("file", newLogo);
        const uploadResponse = await fetch("/api/upload", { method: "POST", body: formData });
        const uploadData = await uploadResponse.json();
        logoUrl = uploadData.url;
      }

      const response = await fetch(`/api/comparators/${comparator.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, description, color, logo: logoUrl }),
      });

      if (!response.ok) throw new Error("Failed to save comparator");
      setIsEditing(false);
    } catch (error) {
      console.error("Error saving comparator:", error);
    }
  };

  const handleSelectGoogleSheets = async () => {
    try {
      setIsLoading(true); // Start the loader

      const response = await fetch("/api/google/check-token");
      const { hasToken } = await response.json();

      if (hasToken) {
        setShowDataSource(!showDataSource); // Toggle the visibility of SelectDataSource
      } else {
        const authUrl = await getGoogleSheetsAuthUrl();
        const popup = window.open(authUrl, "Google Sheets Authentication", "width=600,height=600");

        const interval = setInterval(() => {
          if (popup.closed) {
            clearInterval(interval);
            checkAccessToken(); // Re-check token after popup closes
            router.refresh(); // Refresh the page to load sheets data
          }
        }, 1000);
      }
    } catch (error) {
      console.error("Error initiating Google Sheets auth:", error);
      
    }finally {
      setIsLoading(false); // Stop the loader
    }
  };

  const getGoogleSheetsAuthUrl = async () => {
    try {
      const response = await fetch("/api/google/initiate");
      const data = await response.json();
      return data.url;
    } catch (error) {
      console.error("Error getting Google Sheets auth URL:", error);
      return null;
    }
  };

  return (
    <main className="grid flex-1 items-start gap-4 p-4 sm:px-6 sm:py-0 md:gap-8">
      <div className="mx-auto grid max-w-[59rem] flex-1 auto-rows-max gap-4">
        <div className="flex items-center gap-4">
          <Link href="/web/comparators">
            <Button variant="outline" size="icon" className="h-7 w-7">
              <ChevronLeft className="h-4 w-4" />
              <span className="sr-only">Back</span>
            </Button>
          </Link>
          <h1 className="flex-1 shrink-0 whitespace-nowrap text-xl font-semibold tracking-tight sm:grow-0">
            {name}
          </h1>

          <div className="hidden items-center gap-2 md:ml-auto md:flex">
            {!isEditing && (
              <Button variant="outline" size="sm" onClick={toggleEditMode}>
                Modifier
              </Button>
            )}
            {isEditing && (
              <>
                <Button variant="outline" size="sm" onClick={toggleEditMode}>
                  Annuler
                </Button>
                <Button size="sm" onClick={handleSave}>
                  Enregistrer
                </Button>
              </>
            )}
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-[1fr_250px] lg:grid-cols-3 lg:gap-8">
          <div className="grid auto-rows-max items-start gap-4 lg:col-span-2 lg:gap-8">
            <Card>
              <CardHeader>
                <CardTitle>Détails du comparateur</CardTitle>
                <CardDescription>
                  Modifiez les détails de votre comparateur ici.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-6">
                  <div className="grid gap-3">
                    <Label htmlFor="name">Nom</Label>
                    <Input
                      id="name"
                      type="text"
                      className="w-full"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      readOnly={!isEditing}
                    />
                  </div>
                  <div className="grid gap-3">
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      id="description"
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      className="min-h-32"
                      readOnly={!isEditing}
                    />
                  </div>
                  <div className="grid gap-3">
                    <Label htmlFor="color">Couleur</Label>
                    <Input
                      id="color"
                      type="color"
                      className="w-20"
                      value={color}
                      onChange={(e) => setColor(e.target.value)}
                      disabled={!isEditing}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Source de données</CardTitle>
                <CardDescription>
                  Gérez les sources de données associées à ce comparateur.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex gap-4 h-12">
                  <Button
                    variant="outline"
                    className="flex items-center gap-2 h-full w-full"
                    onClick={handleSelectGoogleSheets}
                  >
                    <Sheet className="h-4 w-4" />
                    Google Sheets
                  </Button>
                  <Button variant="outline" className="flex items-center gap-2 h-full w-full">
                    <FileText className="h-4 w-4" />
                    Notion
                  </Button>
                  <Button variant="outline" className="flex items-center gap-2 h-full w-full">
                    <Database className="h-4 w-4" />
                    Airtable
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid auto-rows-max items-start gap-4 lg:gap-8">
            <Card>
              <CardHeader>
                <CardTitle>Image du comparateur</CardTitle>
                <CardDescription>
                  Téléchargez et gérez l&apos;image associée à ce comparateur.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-2">
                  <Image
                    alt="Comparator image"
                    className="aspect-square w-full rounded-md object-contain"
                    height="300"
                    src={imageSrc}
                    width="300"
                  />
                  {isEditing && (
                    <Input
                      id="logo"
                      type="file"
                      accept="image/*"
                      onChange={handleLogoChange}
                    />
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Conditionally render SelectDataSource based on showDataSource state */}
        {showDataSource && (
          <SelectDataSource
            params={{ comparatorId: comparator.id }}
            sheets={sheets}
            setSheets={setSheets} // Pass setSheets to SelectDataSource
          />
        )}
      </div>
    </main>
  );
}
