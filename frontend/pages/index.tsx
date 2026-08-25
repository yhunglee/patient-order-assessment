import type { NextPage } from 'next';
import { useState } from 'react';
import AssignmentOutlinedIcon from '@mui/icons-material/AssignmentOutlined';
import PersonOutlineIcon from '@mui/icons-material/PersonOutline';
import { Alert, Box, Card, CardActionArea, Chip, CircularProgress, Container, Grid, Stack, Typography } from '@mui/material';
import { OrderDialog } from '../components/OrderDialog';
import { usePatients } from '../hooks/usePatients';
import { Patient } from '../lib/types';

const Home: NextPage = () => {
  const { patients, isLoading, error, reload } = usePatients();
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  return <Box sx={{ minHeight: '100vh', bgcolor: '#f8fafc', py: { xs: 3, sm: 5 } }}>
    <Container maxWidth="md">
      <Stack spacing={1} sx={{ mb: 4 }}><Typography component="h1" variant="h4" fontWeight={700}>Patient Orders</Typography><Typography color="text.secondary">點選住民查看醫囑，並可新增或編輯後回存。</Typography></Stack>
      {error && <Alert severity="error" action={<button onClick={() => void reload()}>重試</button>} sx={{ mb: 2 }}>{error}</Alert>}
      {isLoading ? <Box sx={{ display: 'grid', placeItems: 'center', minHeight: 240 }}><CircularProgress aria-label="資料載入中" /></Box> :
        <Grid container spacing={{ xs: 1.5, sm: 2 }}>
          {patients.map((patient) => <Grid item xs={12} sm={6} md={4} key={patient.id}>
            <Card variant="outlined" sx={{ height: '100%' }}><CardActionArea onClick={() => setSelectedPatient(patient)} sx={{ p: 2.25, minHeight: { xs: 126, sm: 150 }, display: 'block' }}>
              <Stack direction="row" alignItems="center" justifyContent="space-between" spacing={1}><PersonOutlineIcon color="primary" /><Chip size="small" label={patient.order ? '已有醫囑' : '待新增'} color={patient.order ? 'success' : 'default'} /></Stack>
              <Typography variant="h6" sx={{ mt: 2 }}>{patient.name}</Typography>
              <Stack direction="row" spacing={0.5} sx={{ mt: 1 }}><AssignmentOutlinedIcon fontSize="small" color="action" /><Typography variant="body2" color="text.secondary" noWrap>{patient.order?.message ?? '尚未建立醫囑'}</Typography></Stack>
            </CardActionArea></Card>
          </Grid>)}
        </Grid>}
    </Container>
    {/* key 讓切換住民時重建表單草稿，避免將前一位住民的醫囑帶入。 */}
    <OrderDialog key={selectedPatient?.id ?? 'closed'} patient={selectedPatient} onClose={() => setSelectedPatient(null)} onSaved={async () => { await reload(); }} />
  </Box>;
};
export default Home;
