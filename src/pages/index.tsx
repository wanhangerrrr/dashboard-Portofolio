// src/pages/index.tsx
import type { GetServerSideProps } from "next";

export const getServerSideProps: GetServerSideProps = async () => {
  return {
    redirect: {
      destination: "/dashboard",
      permanent: false, // temporary (307) dulu, aman untuk testing
    },
  };
};

export default function HomeRedirect() {
  return null;
}
