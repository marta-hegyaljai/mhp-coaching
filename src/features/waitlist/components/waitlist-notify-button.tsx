import {markWaitlistNotifiedAction} from "@/features/waitlist/admin";
import {Button} from "@/shared/ui/button";

export function WaitlistNotifyButton({
  courseId,
  entryId,
  label,
}: {
  courseId: string;
  entryId: string;
  label: string;
}) {
  return (
    <form action={markWaitlistNotifiedAction.bind(null, courseId, entryId)}>
      <Button type="submit" variant="secondary">
        {label}
      </Button>
    </form>
  );
}
