import { useState } from "react";
import { Box, Button, Typography, Modal } from "@mui/material";
import { useGoogleLogin } from "@react-oauth/google";
import { authLogin } from "../../services/app.service";
import GoogleIcon from "@mui/icons-material/Google";
import { LoginPageStyles as styles } from "../../styles";

interface LoginPageProps {
    handleSuccessfulAuthentication: () => void;
}

const LoginPage = (props: LoginPageProps) => {
  const { handleSuccessfulAuthentication } = props;
  const [showUnauthorizedMessage, setShowUnauthorizedMessage] = useState(false);

  const googleLogin = useGoogleLogin({
    onSuccess: async ({ code }: { code: string }) => {
      authLogin(code)
        .then(response => {
          response.json()
            .then((data: { detail?: { message?: string } }) => {
              if (response.status === 200) {
                handleSuccessfulAuthentication();
              } else if (response.status === 403) {
                console.error("403 error: user is pending");
                setShowUnauthorizedMessage(true);
              } else {
                console.error(data?.detail?.message || "error trying to login");
              }
            }).catch((e: Error) => {
              console.error("error trying to login: " + e);
            });
        }).catch((e: Error) => {
          console.error("error trying to login: " + e);
        });
    },
    flow: "auth-code",
  });

  return (
    <Box sx={styles.outerBox}>
      <Box sx={styles.innerBox}>
        <Modal
          open={true}
        >
          <Box sx={styles.modalBox}>
            <Typography sx={styles.modalLogo} variant="h6" component="h2">
              <img
                src={`${process.env.PUBLIC_URL}/img/OGRRE_logo.svg`}
                width="50%"
                alt="OGRRE logo"
              />
            </Typography>
            <Typography sx={styles.modalTitle} variant="h6" component="h2">
                            OGRRE
            </Typography>
            <Typography sx={styles.modalBody} component="span">
              <Button id='login-button' onClick={googleLogin} variant="contained" startIcon={<GoogleIcon />}>
                                Login with Google
              </Button>
            </Typography>
            <Typography sx={styles.unauthorized}>
              {
                showUnauthorizedMessage && "*You are not authorized to access this application. Please login with a different account or contact the development team to gain access."
              }
            </Typography>
          </Box>
        </Modal>
      </Box>
    </Box>
  );
};

export default LoginPage;
