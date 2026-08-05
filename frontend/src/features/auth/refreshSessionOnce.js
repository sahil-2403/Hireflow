import { refreshSession } from "../../api/auth.api";
import createSingleFlight from "../../utils/createSingleFlight";

const refreshSessionOnce = createSingleFlight(refreshSession);

export default refreshSessionOnce;
