import { useEffect, useMemo, useState } from "react"
import { useTheme } from "next-themes"
import {
  Cloud,
  fetchSimpleIcons,
  renderSimpleIcon,
} from "react-icon-cloud"

export const cloudProps = {
  containerProps: {
    style: {
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
      width: "100%",
      paddingTop: 20,
      paddingBottom: 20,
    },
  },
  options: {
    reverse: true,
    depth: 0.95,
    wheelZoom: false,
    imageScale: 1, // Optimized image resolution to prevent rendering lag
    activeCursor: "default",
    tooltip: "native",
    initial: [0.03, -0.03],
    clickToFront: 500,
    tooltipDelay: 0,
    outlineColour: "#0000",
    maxSpeed: 0.02, // Smooth, slow speed prevents recalculation bottlenecks
    minSpeed: 0.005,
    freezeActive: true,
    freezeDecel: true,
    dragControl: true, // Smooth dragging interaction
    noSelect: true,
    lock: null,
  },
}

export const renderCustomIcon = (icon, theme) => {
  const bgHex = theme === "light" ? "#f3f2ef" : "#080510"
  const fallbackHex = theme === "light" ? "#6e6e73" : "#ffffff"
  const minContrastRatio = theme === "dark" ? 2 : 1.2

  return renderSimpleIcon({
    icon,
    bgHex,
    fallbackHex,
    minContrastRatio,
    size: 42,
    aProps: {
      href: undefined,
      target: undefined,
      rel: undefined,
      onClick: (e) => e.preventDefault(),
    },
  })
}

export function IconCloud({ iconSlugs }) {
  const [data, setData] = useState(null)
  const { theme } = useTheme()

  useEffect(() => {
    fetchSimpleIcons({ slugs: iconSlugs }).then(setData)
  }, [iconSlugs])

  const renderedIcons = useMemo(() => {
    if (!data) return null

    return Object.values(data.simpleIcons).map((icon) =>
      renderCustomIcon(icon, theme || "light"),
    )
  }, [data, theme])

  return (
    <Cloud {...cloudProps}>
      {renderedIcons}
    </Cloud>
  )
}

export default IconCloud;
