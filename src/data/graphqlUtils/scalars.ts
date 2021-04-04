import {
  DateTimeResolver,
  DateTimeTypeDefinition,
  EmailAddressResolver,
  EmailAddressTypeDefinition,
  URLResolver,
  URLTypeDefinition,
  VoidResolver,
  VoidTypeDefinition,
} from 'graphql-scalars'

export const typeDefs = [
  DateTimeTypeDefinition,
  EmailAddressTypeDefinition,
  URLTypeDefinition,
  VoidTypeDefinition,
]

export const resolvers = {
  DateTime: DateTimeResolver,
  EmailAddress: EmailAddressResolver,
  URL: URLResolver,
  Void: VoidResolver,
}
