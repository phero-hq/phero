export type StyledEventStatus = "default" | "error" | "busy"

export type StyledEvent = [StyledEventStatus, string]

export interface ClientProject {
  type: "client"
  path: string
}

export interface ServerProject {
  type: "server"
  path: string
}

export type Project = ClientProject | ServerProject
