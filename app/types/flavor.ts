interface Flavoring<FlavorT> {
  _type?: FlavorT
}

export type Flavor<T, FlavorT> = T & Flavoring<FlavorT>
