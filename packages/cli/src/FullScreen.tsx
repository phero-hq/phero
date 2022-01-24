import { Box } from "ink"
import React, { useContext } from "react"
import { ReactNode, useEffect, useState } from "react"

interface ScreenSize {
  columns: number
  rows: number
  orientation: "portrait" | "landscape"
}

function getOrientation(): ScreenSize["orientation"] {
  const { columns, rows } = process.stdout
  return columns > rows * 2 ? "landscape" : "portrait"
}

const initialScreenSize: ScreenSize = {
  columns: process.stdout.columns,
  rows: process.stdout.rows,
  orientation: getOrientation(),
}

const Context = React.createContext<ScreenSize>(initialScreenSize)

export function useScreenSize(): ScreenSize {
  return useContext(Context)
}

export default function FullScreen({ children }: { children: ReactNode }) {
  const [screenSize, setScreenSize] = useState(initialScreenSize)

  useEffect(() => {
    function onResize() {
      setScreenSize({
        columns: process.stdout.columns,
        rows: process.stdout.rows,
        orientation: getOrientation(),
      })
    }

    process.stdout.on("resize", onResize)
    process.stdout.write("\x1b[?1049h")
    return () => {
      process.stdout.off("resize", onResize)
      process.stdout.write("\x1b[?1049l")
    }
  }, [])

  return (
    <Context.Provider value={screenSize}>
      <Box width={screenSize.columns} height={screenSize.rows}>
        {children}
      </Box>
    </Context.Provider>
  )
}
