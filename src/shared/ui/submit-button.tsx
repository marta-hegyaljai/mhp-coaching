import {Button, type ButtonVariant} from "@/shared/ui/button";
import {SpinnerIcon} from "@/shared/ui/icons";

/**
 * The one pending affordance for form submits: the label swaps and a spinner
 * appears, which is the only ambient motion the design language allows.
 */
export function SubmitButton({
  pending,
  label,
  pendingLabel,
  variant,
  disabled = false,
  block = false,
  name,
  value,
}: {
  pending: boolean;
  label: string;
  pendingLabel: string;
  variant?: ButtonVariant;
  disabled?: boolean;
  block?: boolean;
  name?: string;
  value?: string;
}) {
  return (
    <Button
      type="submit"
      variant={variant}
      block={block}
      disabled={pending || disabled}
      name={name}
      value={value}
    >
      {pending ? (
        <>
          <SpinnerIcon />
          {pendingLabel}
        </>
      ) : (
        label
      )}
    </Button>
  );
}
