import { makeExecutableSchema } from '@graphql-tools/schema'
import gql from 'graphql-tag'
import { AwesomeObject, Resolver } from '.'

export const typeDefs = gql`
  type Base {
    id: ID!
    name: String!
  }

  type Query {
    # A stub to expose the hydrated Base
    base: Base!
  }

  type BaseMutations {
    setName(name: String!): Base!
  }

  type Mutation {
    # A stub to expose the hydrated BaseMutations
    base: BaseMutations!
  }
`

export const schema = makeExecutableSchema({ typeDefs })

export class Base extends AwesomeObject {
  constructor(state: DurableObjectState, env: Environment) {
    super({ typeDefs, typeName: 'base' }, state, env)
  }

  get id(): string {
    return this._id.toString()
  }

  // Getters (Queries) can look like this ↓
  get name(): Promise<string> {
    return this._storage
      .get<string>('name')
      .then((name) => name || 'Untitled Base')
  }

  // or like this ↓
  // name: Resolver<undefined, string, Base> = async function name() {
  //   return this._storage
  //     .get<string>('name')
  //     .then((name) => name || 'Untitled Base')
  // }

  // Setters (Mutations) have to look like this ↓
  setName: Resolver<{ name: string }, Base, Base> = async function setName(
    this,
    { name },
  ) {
    await this._storage.put('name', name)
    return this
  }
}
