import React from "react"

interface Props {
  id: string
  aspectRatio: number
}

export default function YoutubeVideo({ id, aspectRatio }: Props) {
  return (
    <div style={{ ...styles.container, paddingTop: `${aspectRatio * 100}%` }}>
      <iframe
        style={styles.iframe}
        src={`https://www.youtube.com/embed/${id}`}
        // title="YouTube video player"
        frameBorder="0"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
      ></iframe>
    </div>
  )
}

const styles: { [key: string]: React.CSSProperties } = {
  container: {
    position: "relative",
    width: "100%",
    marginBottom: "var(--ifm-leading)",
  },
  iframe: {
    position: "absolute",
    top: 0,
    left: 0,
    width: "100%",
    height: "100%",
  },
}
