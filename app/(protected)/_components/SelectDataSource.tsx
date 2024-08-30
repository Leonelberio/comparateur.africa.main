//@ts-nocheck

"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Sheet, Loader2 } from "lucide-react";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, 
  DialogHeader, DialogTitle, DialogTrigger
} from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { useRouter } from "next/navigation";

export default function SelectDataSource({ params, sheets, setSheets, handleSheetClick }) {
  const [searchQuery, setSearchQuery] = useState<string>(""); 
  const [isLoading, setIsLoading] = useState(false); 
  const [selectedSpreadsheet, setSelectedSpreadsheet] = useState<string | null>(null);
  const [selectedTab, setSelectedTab] = useState<string | null>(null);
  const [tabs, setTabs] = useState<string[]>([]);
  const [rows, setRows] = useState<string[]>([]); // State for rows
  const [columns, setColumns] = useState<string[]>([]);
  const [filteredTabs, setFilteredTabs] = useState<string[]>([]);
  const [filteredRows, setFilteredRows] = useState<string[]>([]); // State for filtered rows
  const [filteredColumns, setFilteredColumns] = useState<string[]>([]); // State for filtered columns
  const [selectedRows, setSelectedRows] = useState<string[]>([]); // Define selectedRows locally
  const [selectedColumns, setSelectedColumns] = useState<string[]>([]); // Define selectedColumns locally
  const [tabSearchQuery, setTabSearchQuery] = useState<string>(""); // State for tab search functionality
  const [rowSearchQuery, setRowSearchQuery] = useState<string>(""); // State for row search functionality
  const [columnSearchQuery, setColumnSearchQuery] = useState<string>(""); // State for column search functionality
  const [isComponentVisible, setIsComponentVisible] = useState(true); // State to manage component visibility
  const router = useRouter();


  useEffect(() => {
    handleSelectGoogleSheets();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSelectGoogleSheets = async () => {
    try {
      setIsLoading(true); 
      const response = await fetch("/api/google/sheets");
      if (!response.ok) {
        throw new Error("Failed to fetch Google Sheets data");
      }
      const data = await response.json();
      setSheets(data.sheets || []);
    } catch (error) {
      console.error("Error fetching Google Sheets data:", error);
      setSheets([]);
    } finally {
      setIsLoading(false); 
    }
  };

  const onSheetClick = async (spreadsheetId: string) => {
    setSelectedSpreadsheet(spreadsheetId);
    try {
      setIsLoading(true); 
      const response = await fetch(`/api/google/sheets/${spreadsheetId}/tabs`);
      if (!response.ok) {
        throw new Error("Failed to fetch tabs");
      }
      const data = await response.json();
      setTabs(data.tabs || []);
      setFilteredTabs(data.tabs || []); // Set initial filtered tabs to all tabs
    } catch (error) {
      console.error("Error fetching tabs:", error);
      setTabs([]);
      setFilteredTabs([]);
    } finally {
      setIsLoading(false); 
    }
  };

  const onTabClick = async (tabName: string) => {
    setSelectedTab(tabName);
    try {
      setIsLoading(true);
      if (!selectedSpreadsheet) return;
  
      // Fetch rows
      const rowsResponse = await fetch(`/api/google/sheets/${selectedSpreadsheet}/rows?tab=${tabName}`);
      if (!rowsResponse.ok) {
        throw new Error("Failed to fetch rows");
      }
      const rowsData = await rowsResponse.json();
  
  
      // Filter rows to get only those with non-null values in the first column, starting from the second row
      const filteredNonNullRows = rowsData.rows
        .slice(1) // Omit the first row
        .filter((row: any) => {
          console.log('Inspecting row:', row); // Log each row to inspect
          return row[0] && row[0].trim() !== "";
        })
        .map((row: any) => row[0]); // Extract only the first column's non-null values
  
  
      setRows(filteredNonNullRows || []);
      setFilteredRows(filteredNonNullRows || []); // Set initial filtered rows to all non-null rows
  
      // Fetch columns
      const columnsResponse = await fetch(`/api/google/sheets/${selectedSpreadsheet}/columns?tab=${tabName}`);
      if (!columnsResponse.ok) {
        throw new Error("Failed to fetch columns");
      }
      const columnsData = await columnsResponse.json();
      const validColumns = columnsData.columns.filter((column: string) => column && column.trim() !== "");
      setColumns(validColumns || []);
      setFilteredColumns(validColumns || []); // Set initial filtered columns to all columns
    } catch (error) {
      console.error("Error fetching rows and columns:", error);
      setRows([]);
      setFilteredRows([]);
      setColumns([]);
      setFilteredColumns([]);
    } finally {
      setIsLoading(false);
    }
  };
  
  
  
  
  const handleTabSearch = (query: string) => {
    setTabSearchQuery(query);
    setFilteredTabs(
      tabs.filter((tab) => tab.toLowerCase().includes(query.toLowerCase()))
    );
  };
  const handleRowSearch = (query: string) => {
    setRowSearchQuery(query);
    setFilteredRows(
      rows
        .filter((rowValue) => 
          rowValue.toLowerCase().includes(query.toLowerCase())
        )
    );
  };
  


  const handleColumnSearch = (query: string) => {
    setColumnSearchQuery(query);
    setFilteredColumns(
      columns.filter((column) => {
        const columnString = typeof column === 'string' ? column : column?.name || ''; // Adjust based on your data structure
        return columnString.toLowerCase().includes(query.toLowerCase());
      })
    );
  };
  const handleRowToggle = (row: string) => {
    setSelectedRows((prevSelected) =>
      prevSelected.includes(row)
        ? prevSelected.filter((r) => r !== row)
        : [...prevSelected, row]
    );
  };

  const handleColumnToggle = (column: string) => {
    setSelectedColumns((prevSelected) =>
      prevSelected.includes(column)
        ? prevSelected.filter((c) => c !== column)
        : [...prevSelected, column]
    );
  };

  const handleNextClick = async () => {
    try {
      const response = await fetch("/api/google/sheets/token", {
        method: "GET",
      });
  
      const { accessToken } = await response.json();
  
      const authKey = accessToken;
      const type = "GoogleSheets";
      const sheetId = selectedSpreadsheet;
      const tabName = selectedTab;
  
      if (!authKey || !sheetId || !selectedColumns.length) {
        throw new Error("Missing necessary data for saving data source");
      }
      console.log(authKey);
  
      // Data that would be saved
      const dataSource = {
        comparatorId: params.comparatorId,
        authKey,
        type,
        sheetId,
        lastUsed: new Date(),
      };
  
      // Include both selected rows and columns in the dataForView object
      const dataForView = {
        tabName,
        rows: selectedRows,
        columns: selectedColumns,
      };
  
      // Save the selected rows and columns to localStorage
      localStorage.setItem("selectedColumns", JSON.stringify(dataForView));
  
      // Commented out the part where data is saved to the database
      // const saveResponse = await fetch("/api/data-sources", {
      //   method: "POST",
      //   headers: {
      //     "Content-Type": "application/json",
      //   },
      //   body: JSON.stringify({ dataSource, rows: selectedRows, columns: selectedColumns, tabName }),
      // });
  
      // if (!saveResponse.ok) {
      //   throw new Error("Failed to save data source");
      // }
  
      // Continue navigation and refreshing
      router.push(`/web/comparators/${params.comparatorId}/views/compare`);
      router.refresh();
  
    } catch (error) {
      console.error("Error saving data source and navigating:", error);
    }
  };
  
  
  const handleDisconnect = async () => {
    try {
      setIsLoading(true); // Start the loader
      const response = await fetch("/api/google/disconnect", {
        method: "POST",
      });

      if (!response.ok) {
        throw new Error("Failed to disconnect from Google Sheets");
      }

      // Clear the Sheets data
      setSheets([]);
      setTabs([]);
      setColumns([]);
      setRows([]);
      setSelectedSpreadsheet(null);
      setSelectedTab(null);

      // Hide the component
      setIsComponentVisible(false);

      // Refresh the page without full reload
      router.refresh(); 
    } catch (error) {
      console.error("Error disconnecting from Google Sheets:", error);
    } finally {
      setIsLoading(false); // Stop the loader
    }
  };

  const filteredSheets = sheets.filter((sheet) =>
    sheet.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    isComponentVisible && (
      <div>
        <Card>
          <CardHeader>
            <CardTitle>Choisir une feuille</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col gap-4">
              <Input
                type="text"
                placeholder="Rechercher des feuilles..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />

              {isLoading ? (
                <div className="flex justify-center items-center h-40">
                  <Loader2 className="animate-spin h-10 w-10 text-gray-600" />
                </div>
              ) : (
                filteredSheets.length > 0 && (
                  <div className="h-40 overflow-y-auto grid gap-8">
                    {filteredSheets.map((sheet) => (
                      <div
                        key={sheet.id}
                        className="flex items-center gap-4 cursor-pointer"
                        onClick={() => onSheetClick(sheet.id)}
                      >
                        <Sheet />
                        <div className="grid gap-1">
                          <p className="text-sm font-medium leading-none">{sheet.name}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )
              )}

              <div className="flex justify-between gap-4">
                <Button onClick={handleSelectGoogleSheets}>
                  Rafraîchir les feuilles Google Sheets
                </Button>

                <Button variant="destructive" onClick={handleDisconnect}>
                  Déconnecter
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <Dialog open={!!selectedSpreadsheet && !selectedTab} onOpenChange={() => setSelectedSpreadsheet(null)}>
          <DialogTrigger asChild></DialogTrigger>
          <DialogContent className="sm:max-w-[600px]"> {/* Adjust the width */}
            <DialogHeader>
              <DialogTitle>Choisissez une feuille</DialogTitle>
              <DialogDescription>Sélectionnez la feuille à partir de laquelle vous souhaitez extraire des données.</DialogDescription>
            </DialogHeader>
            <div className="flex flex-col gap-2">
              <Input
                type="text"
                placeholder="Rechercher des feuilles..."
                value={tabSearchQuery}
                onChange={(e) => handleTabSearch(e.target.value)}
              />
              {isLoading ? (
                <div className="flex justify-center items-center h-40">
                  <Loader2 className="animate-spin h-10 w-10 text-gray-600" />
                </div>
              ) : (
                <div className="h-40 overflow-y-auto space-y-2">
                  {filteredTabs.map((tab, index) => (
                    <label
                      key={index}
                      className="flex items-center space-x-3 cursor-pointer text-primary underline"
                      onClick={() => onTabClick(tab)}
                    >
                      <span>{tab}</span>
                    </label>
                  ))}
                </div>
              )}
            </div>
            <DialogFooter>
              <Button variant="secondary" onClick={() => setSelectedSpreadsheet(null)}>
                Annuler
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog open={!!selectedTab} onOpenChange={() => setSelectedTab(null)}>
          <DialogTrigger asChild></DialogTrigger>
          <DialogContent className="sm:max-w-[800px] h-[600px]"> {/* Adjust the width and height */}
            <DialogHeader>
              <DialogTitle>Sélectionner les champs</DialogTitle>
              <DialogDescription>Sélectionnez les lignes et colonnes à utiliser pour la comparaison.</DialogDescription>
            </DialogHeader>
            <div className="flex flex-col gap-4 flex-1 overflow-hidden"> {/* Ensure it stretches to fill height */}
              <div className="grid grid-cols-2 gap-8 flex-1 overflow-hidden"> {/* Increase gap between columns */}
                {/* Row Selection */}
                <div className="flex flex-col gap-4 flex-1 overflow-y-scroll"> {/* Add gap between searchbox and list */}
                  <Input
                    type="text"
                    placeholder="Rechercher des lignes..."
                    value={rowSearchQuery}
                    onChange={(e) => handleRowSearch(e.target.value)}
                  />
                  <div className="overflow-y-auto space-y-2 flex-1">
                  {filteredRows.length > 0 ? (
  <div className="h-40 overflow-y-auto space-y-2">
    {filteredRows.map((rowValue, index) => (
      <div key={index} className="flex items-center space-x-2">
        <Checkbox
          id={`row-${index}`}
          onCheckedChange={() => handleRowToggle(rowValue)}
        />
        <label
          htmlFor={`row-${index}`}
          className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
        >
          {rowValue}
        </label>
      </div>
    ))}
  </div>
) : (
  <p>No non-null values found in the first column.</p>
)}


                  </div>
                </div>

                {/* Column Selection */}
                <div className="flex flex-col gap-4 flex-1 overflow-y-scroll"> {/* Add gap between searchbox and list */}
                  <Input
                    type="text"
                    placeholder="Rechercher des colonnes..."
                    value={columnSearchQuery}
                    onChange={(e) => handleColumnSearch(e.target.value)}
                  />
                  <div className="overflow-y-auto space-y-2 flex-1">
                    {filteredColumns.map((column, index) => (
                      <div key={index} className="flex items-center space-x-2">
                        <Checkbox
                          id={`column-${index}`}
                          onCheckedChange={() => handleColumnToggle(column)}
                        />
                        <label
                          htmlFor={`column-${index}`}
                          className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                        >
                          {column}
                        </label>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <DialogFooter>
                <Button variant="secondary" onClick={() => setSelectedTab(null)}>
                  Annuler
                </Button>
                <Button onClick={handleNextClick}>Suivant</Button>
              </DialogFooter>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    )
  );
}
