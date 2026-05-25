import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";

dayjs.extend(utc);
dayjs.extend(timezone);

export { dayjs };

export function kstToday(): string {
  return dayjs().tz("Asia/Seoul").format("YYYY-MM-DD");
}
