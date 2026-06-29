// import type { LoginCredentials, LoginResponse, UserProfile } from '../types/auth.types';

// export const authApi = {
//   login: async (data: LoginCredentials): Promise<{ data: LoginResponse }> => {
//     return new Promise((resolve) => {
//       setTimeout(() => {
//         resolve({
//           data: {
//             token: 'mock-jwt-token-777',
//             user: {
//               id: 1,
//               email: data.email,
//               name: 'Тестовый Пользователь',
//               is_super_admin: false,
//               is_data_admin: false,
//               is_user_admin: false,
//               rules_accepted: true
//             }
//           }
//         });
//       }, 800);
//     });
//   },
  
//   getProfile: async (): Promise<{ data: UserProfile }> => {
//     return new Promise((resolve) => {
//       setTimeout(() => {
//         resolve({
//           data: {
//             id: 1,
//             email: 'test@example.com',
//             name: 'Тестовый Пользователь',
//             is_user_admin: false,
//             is_data_admin: false,
//             is_super_admin: false,
//             rules_accepted: true
//           }
//         });
//       }, 500);
//     });
//   },

//   acceptRules: async (): Promise<void> => {
//     return new Promise((resolve) => setTimeout(resolve, 500));
//   },
// };