"use client"

import React, { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import { DataComparator } from "@/app/(protected)/_components/data-comparator"
import Loader from "../../../loading"

const ComparatorView = () => {
  const { comparatorId } = useParams()

  const [selectedColumns, setSelectedColumns] = useState<string[]>([])
  const [selectedRows, setSelectedRows] = useState<string[]>([])

  useEffect(() => {
    if (comparatorId) {
      // Retrieve selected columns and rows from localStorage
      const storedData = JSON.parse(localStorage.getItem("selectedColumns") || "{}")
      setSelectedColumns(storedData.columns || [])
      setSelectedRows(storedData.rows || [])
    }
  }, [comparatorId])

  if (!comparatorId || selectedColumns.length === 0) {
    return <Loader/>
  }

  return (
    <div>
      <DataComparator
        selectedColumns={selectedColumns} // Pass the retrieved columns to the DataComparator
        selectedRows={selectedRows} // Pass the retrieved rows to the DataComparator
        title="Comparez les données"
        placeholder="Sélectionnez les champs"
      />
    </div>
  )
}

export default ComparatorView
