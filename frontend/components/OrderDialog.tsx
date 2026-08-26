import { useMemo, useState } from "react";
import AddIcon from "@mui/icons-material/Add";
import CloseIcon from "@mui/icons-material/Close";
import EditIcon from "@mui/icons-material/Edit";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Alert,
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  IconButton,
  List,
  ListItem,
  ListItemText,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { api } from "../lib/api";
import { Order, Patient } from "../lib/types";

type Props = {
  patient: Patient | null;
  onClose: () => void;
  onSaved: () => Promise<void>;
};

/** 將 API 的 ISO 時間轉成使用者容易閱讀的建立日期與時間。 */
const formatCreatedAt = (createdAt: string) =>
  new Intl.DateTimeFormat("zh-TW", {
    dateStyle: "medium",
    timeStyle: "medium",
  }).format(new Date(createdAt));

export function OrderDialog({ patient, onClose, onSaved }: Props) {
  const [isEditing, setIsEditing] = useState(false);
  const [message, setMessage] = useState(patient?.order?.message ?? "");
  const [currentOrder, setCurrentOrder] = useState<Order | null>(
    patient?.order ?? null,
  );
  const [orderHistory, setOrderHistory] = useState<Order[]>(
    patient?.orderHistory ?? [],
  );
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const historicalOrders = useMemo(
    () => orderHistory.filter((order) => order.id !== currentOrder?.id),
    [currentOrder?.id, orderHistory],
  );

  const save = async () => {
    if (!patient) return;
    if (!message.trim()) {
      setError("請輸入醫囑內容");
      return;
    }

    setIsSaving(true);
    setError(null);
    setSuccessMessage(null);
    try {
      const savedOrder = currentOrder
        ? await api.updateOrder(currentOrder.id, message.trim())
        : await api.createOrder(patient.id, message.trim());

      // 儲存後立即以 API 回傳的新版本更新唯讀畫面，不必關閉 Dialog 才能確認結果。
      setCurrentOrder(savedOrder);
      setOrderHistory((previousHistory) => [
        savedOrder,
        ...previousHistory.filter((order) => order.id !== savedOrder.id),
      ]);
      setMessage(savedOrder.message);
      setIsEditing(false);
      setSuccessMessage("醫囑已成功儲存，以下為最新醫囑與建立時間。");
      await onSaved();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "儲存醫囑失敗");
    } finally {
      setIsSaving(false);
    }
  };

  const hasOrder = Boolean(currentOrder);

  return (
    <Dialog
      open={Boolean(patient)}
      onClose={isSaving ? undefined : onClose}
      fullWidth
      maxWidth="sm"
      fullScreen={false}
      PaperProps={{ sx: { mx: { xs: 1, sm: 3 } } }}
    >
      <DialogTitle sx={{ pr: 14 }}>
        {patient?.name}的醫囑
        <IconButton
          aria-label="關閉"
          onClick={onClose}
          disabled={isSaving}
          sx={{ position: "absolute", right: 8, top: 8 }}
        >
          <CloseIcon />
        </IconButton>
        <Button
          size="small"
          startIcon={hasOrder ? <EditIcon /> : <AddIcon />}
          onClick={() => {
            setMessage(currentOrder?.message ?? "");
            setError(null);
            setSuccessMessage(null);
            setIsEditing(true);
          }}
          // 表單已開啟時不可重複觸發編輯／新增，避免重設使用者正在輸入的內容。
          disabled={isSaving || isEditing || !hasOrder}
          sx={{ position: "absolute", right: 48, top: 12 }}
        >
          {hasOrder ? "編輯" : "新增醫囑"}
        </Button>
      </DialogTitle>
      <DialogContent dividers>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}
        {successMessage && (
          <Alert severity="success" sx={{ mb: 2 }}>
            {successMessage}
          </Alert>
        )}
        {isEditing || !hasOrder ? (
          <TextField
            autoFocus
            fullWidth
            multiline
            minRows={5}
            label="醫囑內容"
            value={message}
            onChange={(event) => setMessage(event.target.value)}
            inputProps={{ maxLength: 500 }}
            helperText={`${message.length} / 500`}
          />
        ) : (
          <Stack spacing={1.5}>
            <Box
              sx={{
                minHeight: 120,
                whiteSpace: "pre-wrap",
                color: "text.primary",
              }}
            >
              {currentOrder?.message}
            </Box>
            <Typography variant="body2" color="text.secondary">
              建立時間：{formatCreatedAt(currentOrder!.createdAt)}
            </Typography>
            <Divider />
            <Accordion
              disableGutters
              elevation={0}
              sx={{ "&:before": { display: "none" } }}
            >
              <AccordionSummary
                expandIcon={<ExpandMoreIcon />}
                aria-controls="order-history-content"
                id="order-history-header"
              >
                <Typography fontWeight={600}>
                  歷史醫囑（{historicalOrders.length} 筆）
                </Typography>
              </AccordionSummary>
              <AccordionDetails id="order-history-content" sx={{ px: 0 }}>
                {historicalOrders.length === 0 ? (
                  <Typography color="text.secondary">尚無歷史醫囑。</Typography>
                ) : (
                  <List disablePadding aria-label="歷史醫囑列表">
                    {historicalOrders.map((order, index) => (
                      <ListItem
                        key={order.id}
                        divider={index < historicalOrders.length - 1}
                        alignItems="flex-start"
                      >
                        <ListItemText
                          primary={
                            <Typography sx={{ whiteSpace: "pre-wrap" }}>
                              {order.message}
                            </Typography>
                          }
                          secondary={`建立時間：${formatCreatedAt(order.createdAt)}`}
                        />
                      </ListItem>
                    ))}
                  </List>
                )}
              </AccordionDetails>
            </Accordion>
          </Stack>
        )}
      </DialogContent>
      {(isEditing || !hasOrder) && (
        <DialogActions sx={{ p: 2 }}>
          <Button
            onClick={() => {
              setMessage(currentOrder?.message ?? "");
              setIsEditing(false);
              setError(null);
            }}
            disabled={isSaving}
          >
            取消
          </Button>
          <Button
            variant="contained"
            onClick={() => void save()}
            disabled={isSaving}
          >
            {isSaving ? (
              <CircularProgress color="inherit" size={20} />
            ) : (
              "回存醫囑"
            )}
          </Button>
        </DialogActions>
      )}
    </Dialog>
  );
}
