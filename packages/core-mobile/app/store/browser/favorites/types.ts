import { EntityState } from '@reduxjs/toolkit'

export type FavoriteId = string

export type Favorite = {
  id: FavoriteId
  favicon: string //url to favicon
  title: string //title grabbed from html metadata
  description: string //description grabbed from html metadata
  url: string
}

export type FavoriteState = EntityState<Favorite>
