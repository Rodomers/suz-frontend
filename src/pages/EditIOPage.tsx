// import { useParams, Navigate } from 'react-router-dom';
// import { IOForm } from '../components/IOForm';
// import { useAuthStore } from '../store/useAuthStore';

// export const EditIOPage = () => {
//   const { id } = useParams<{ id: string }>();
//   const { user } = useAuthStore();

//   if (!user) {
//     return <Navigate to="/login" replace />;
//   }

//   return (
//     <div className="max-w-5xl mx-auto space-y-6">
//       <IOForm ioId={id} />
//     </div>
//   );
// };

import { useParams, Navigate } from 'react-router-dom';
import { IOForm } from '../components/IOForm';
import { useAuthStore } from '../store/useAuthStore';

export const EditIOPage = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuthStore();

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <IOForm ioId={id} />
    </div>
  );
};