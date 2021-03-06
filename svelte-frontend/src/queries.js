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

export const REVOKE_TOKEN = gql`
	mutation($refreshToken: String!) {
		revokeToken(refreshToken: $refreshToken) {
			revoked
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

export const CHECK_LOGIN = gql`
	{
		checkLogin
	}
`;

export const REFRESH_TOKEN = gql`
	mutation($refreshToken: String!) {
		refreshToken(refreshToken: $refreshToken) {
			token
			refreshToken
			payload
		}
	}
`;

export const SEND_INVITATION = gql`
	mutation($employeeEmail: String!) {
		createUserConnection(employeeEmail: $employeeEmail) {
			userConnection {
				id
				employeeEmail
				company {
					id
					email
				}
				isConfirmed
				isDeclined
			}
		}
	}
`;

export const GET_INVITATIONS = gql`
	query {
		invitations {
			id
			created
			isDeclined
			isConfirmed
			employeeEmail
			company {
				id
				userprofile {
					id
					companyName
				}
			}
		}
	}
`;

export const CONFIRM_INVITATION = gql`
	mutation($invitationId: ID!) {
		confirmUserConnection(userConnectionId: $invitationId) {
			userConnection {
				id
				isConfirmed
				employeeEmail
				company {
					id
					userprofile {
						id
						companyName
					}
				}
				created
			}
		}
	}
`;

export const GET_CONNECTIONS = gql`
	query {
		connections {
			id
			created
			isConfirmed
			isDeclined
			company {
				id
				userprofile {
					id
					companyName
				}
			}
			employee {
				id
				email
				userprofile {
					id
					firstName
					lastName
				}
			}
		}
	}
`;

export const GET_SHIFTS = gql`
	query($companyId: ID!) {
		shifts(companyId: $companyId) {
			id
			fromTime
			toTime
			note
			isSponsored
			created
			postedBy {
				id
				email
				userprofile {
					id
					firstName
					lastName
				}
			}
			postedTo {
				id
				email
				userprofile {
					id
					companyName
				}
			}
		}
	}
`;

export const GET_MY_SHIFTS = gql`
	query($companyId: ID!) {
		myShifts(companyId: $companyId) {
			id
			fromTime
			toTime
			note
			isSponsored
			created
			postedBy {
				id
				email
				userprofile {
					id
					firstName
					lastName
				}
			}
			postedTo {
				id
				email
				userprofile {
					id
					companyName
				}
			}
		}
	}
`;

export const POST_SHIFT = gql`
	mutation(
		$fromTime: DateTime!
		$toTime: DateTime!
		$note: String!
		$isSponsored: Boolean!
		$companyId: ID!
	) {
		createShift(
			fromTime: $fromTime
			toTime: $toTime
			note: $note
			isSponsored: $isSponsored
			companyId: $companyId
		) {
			shift {
				id
				fromTime
				toTime
				note
				isSponsored
				created
				postedBy {
					id
					email
					userprofile {
						id
						firstName
						lastName
					}
				}
				postedTo {
					id
					email
					userprofile {
						id
						companyName
					}
				}
			}
		}
	}
`;

export const PROPOSE_SHIFT = gql`
	mutation($proposedShiftId: ID!, $shiftId: ID!) {
		createShiftConnection(
			proposedShiftId: $proposedShiftId
			shiftId: $shiftId
		) {
			shiftConnection {
				id
				created
				isAccepted
				shift {
					id
					fromTime
					toTime
					isSponsored
					postedBy {
						id
						email
						userprofile {
							firstName
							lastName
						}
					}
				}
				proposedShift {
					id
					fromTime
					toTime
					isSponsored
					postedBy {
						id
						email
						userprofile {
							firstName
							lastName
						}
					}
				}
			}
		}
	}
`;

export const GET_SHIFT_CONNECTIONS = gql`
	query($companyId: ID!) {
		shiftConnections(companyId: $companyId) {
			id
			created
			isAccepted
			shift {
				id
				fromTime
				toTime
				note
				isSponsored
				postedBy {
					id
					userprofile {
						id
						firstName
						lastName
					}
				}
				postedTo {
					id
					userprofile {
						id
						companyName
					}
				}
			}
			proposedShift {
				id
				fromTime
				toTime
				note
				isSponsored
				postedBy {
					id
					userprofile {
						id
						firstName
						lastName
					}
				}
				postedTo {
					id
					userprofile {
						id
						companyName
					}
				}
			}
		}
	}
`;

export const ACCEPT_SHIFT_CONNECTION = gql`
	mutation($shiftConnectionId: ID!) {
		confirmShiftConnection(shiftConnectionId: $shiftConnectionId) {
			shiftConnection {
				id
				created
				isAccepted
				shift {
					id
				}
				proposedShift {
					id
				}
			}
		}
	}
`;
