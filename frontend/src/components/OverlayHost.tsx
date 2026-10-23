import { useOverlay } from "@/src/state/overlay";
import { Drawer } from "./Drawer";
import { PlusMenu } from "./PlusMenu";
import { CreateSubSheet } from "./sheets/CreateSubSheet";
import { DepositSheet } from "./sheets/DepositSheet";
import { BackupSheet, NotificationsSheet, PeriodSheet, SignOutSheet, TeamHelpSheet } from "./sheets/MiscSheets";
import { SendSheet } from "./sheets/SendSheet";
import { SubActionsSheet, SubDeleteSheet } from "./sheets/SubActionsSheet";
import { SubMoveSheet } from "./sheets/SubMoveSheet";

/** Mounted after the tab navigator so menus, drawer and sheets sit above the nav bar. */
export function OverlayHost() {
  const { sheet, close, plusOpen, drawerOpen } = useOverlay();
  return (
    <>
      {plusOpen ? <PlusMenu /> : null}
      {drawerOpen ? <Drawer /> : null}
      {sheet === "deposit" ? <DepositSheet onClose={close} /> : null}
      {sheet === "transfer" ? <SendSheet mode="transfer" onClose={close} /> : null}
      {sheet === "withdraw" ? <SendSheet mode="withdraw" onClose={close} /> : null}
      {sheet === "subDeposit" ? <SubMoveSheet mode="allocate" onClose={close} /> : null}
      {sheet === "subWithdraw" ? <SubMoveSheet mode="release" onClose={close} /> : null}
      {sheet === "createSub" ? <CreateSubSheet onClose={close} /> : null}
      {sheet === "notifications" ? <NotificationsSheet onClose={close} /> : null}
      {sheet === "backup" ? <BackupSheet onClose={close} /> : null}
      {sheet === "signOut" ? <SignOutSheet onClose={close} /> : null}
      {sheet === "teamHelp" ? <TeamHelpSheet onClose={close} /> : null}
      {sheet === "period" ? <PeriodSheet onClose={close} /> : null}
      {sheet === "subActions" ? <SubActionsSheet onClose={close} /> : null}
      {sheet === "subDelete" ? <SubDeleteSheet onClose={close} /> : null}
    </>
  );
}
