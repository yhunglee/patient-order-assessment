import { useState } from "react";
import AddIcon from "@mui/icons-material/Add";
import EditIcon from "@mui/icons-material/Edit";
import CloseIcon from "@mui/icons-material/Close";
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { api } from "../lib/api";
import { Patient } from "../lib/types";

type Props = {
  patient: Patient | null;
  onClose: () => void;
  onSaved: () => Promise<void>;
};
export function OrderDialog({ patient, onClose, onSaved }: Props) {
  const [isEditing, setIsEditing] = useState(false);
  const [message, setMessage] = useState(patient?.order?.message ?? "");
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const save = async () => {
    if (!patient) return;
    if (!message.trim()) {
      setError("請輸入醫囑內容");
      return;
    }
    setIsSaving(true);
    setError(null);
    try {
      if (patient.order)
        await api.updateOrder(patient.order.id, message.trim());
      else await api.createOrder(patient.id, message.trim());
      await onSaved();
      onClose();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "儲存醫囑失敗");
    } finally {
      setIsSaving(false);
    }
  };
  const hasOrder = Boolean(patient?.order);
  
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
          onClick={() => setIsEditing(true)}
          disabled={isSaving}
          sx={{ position: "absolute", right: 48, top: 12 }}
        >
          {hasOrder ? "編輯" : "新增 Order"}
        </Button>
      </DialogTitle>
      <DialogContent dividers>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
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
          <Box
            sx={{
              minHeight: 120,
              whiteSpace: "pre-wrap",
              color: "text.primary",
            }}
          >
            {patient?.order?.message}
          </Box>
        )}
      </DialogContent>
      {(isEditing || !hasOrder) && (
        <DialogActions sx={{ p: 2 }}>
          <Button
            onClick={() => {
              setMessage(patient?.order?.message ?? "");
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
