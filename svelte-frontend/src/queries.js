import { gql } from 'apollo-boost';

export const CREATE_USER = gql`
  mutation(
    $isCompany: Boolean!
    $name: String!
    $email: String!
    $password: String!
  ) {
    createUser(
      isCompany: $isCompany
      name: $name
      email: $email
      password: $password
    ) {
      user {
        id
        username
        isActive
      }
    }
  }
`;

export const ACTIVATE_USER = gql`
  mutation($email: String!, $code: String!) {
    activateUser(email: $email, code: $code) {
      activated
    }
  }
`;

export const LOGIN_USER = gql`
  mutation($email: String!, $password: String!) {
    tokenAuth(email: $email, password: $password) {
      token
      refreshToken
    }
  }
`;

export const GET_USER = gql`
  {
    me {
      id
      dateJoined
      email
      isCompany
    }
  }
`;

export const REFRESH_TOKEN = gql`
  mutation($refreshToken: String!) {
    refreshToken(refreshToken: $refreshToken) {
      token
      refreshToken
    }
  }
`;
