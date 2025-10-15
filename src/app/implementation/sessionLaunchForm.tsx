'use client';

import React, { useState, useCallback } from 'react';
import {
  Box,
  Tabs,
  Tab,
  MenuItem,
  Button,
  Alert,
  Divider,
  Grid,
  Tooltip,
  SelectChangeEvent,
  useTheme,
  FormControl,
  FormLabel,
  RadioGroup,
  FormControlLabel,
  Radio,
  Typography,
} from '@mui/material';
import { HelpOutline as HelpOutlineIcon } from '@mui/icons-material';
import { Select } from '@/app/components/Select/Select';
import { TextField } from '@/app/components/TextField/TextField';
import { Card, CardContent } from '@/app/components/Card';
import {
  SessionLaunchFormProps,
  SessionFormData,
} from '@/app/types/SessionLaunchFormProps';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;
  const theme = useTheme();

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`session-tabpanel-${index}`}
      aria-labelledby={`session-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ pt: theme.spacing(3) }}>{children}</Box>}
    </div>
  );
}

const DEFAULT_PROJECTS = ['alinga', 'skaha'];

const DEFAULT_IMAGES = [
  'images-rc.canfar.net/skaha/skaha-notebook:22.09-test',
  'images-rc.canfar.net/skaha/skirt-notebook:latest',
];

const DEFAULT_MEMORY_OPTIONS = [
  1, 2, 4, 6, 8, 10, 12, 14, 16, 20, 24, 26, 28, 30, 32, 36, 40, 44, 48, 56, 64,
  80, 92, 112, 128, 140, 170, 192,
];
const DEFAULT_CORE_OPTIONS = Array.from({ length: 16 }, (_, i) => i + 1);

export const SessionLaunchFormImpl = React.forwardRef<
  HTMLDivElement,
  SessionLaunchFormProps
>(
  (
    {
      onLaunch,
      onReset,
      projects = DEFAULT_PROJECTS,
      containerImages = DEFAULT_IMAGES,
      memoryOptions,
      coreOptions,
      defaultValues = {
        type: 'notebook',
        project: 'skaha',
        containerImage: DEFAULT_IMAGES[0],
        sessionName: 'notebook1',
        memory: 8,
        cores: 2,
      },
      isLoading = false,
      errorMessage,
    },
    ref
  ) => {
    const theme = useTheme();
    const [tabValue, setTabValue] = useState(0);
    const [resourceType, setResourceType] = useState<'flexible' | 'fixed'>(
      'flexible'
    );
    const [formData, setFormData] = useState<SessionFormData>({
      type: defaultValues.type || 'notebook',
      project: defaultValues.project || 'skaha',
      containerImage: defaultValues.containerImage || DEFAULT_IMAGES[0],
      sessionName: defaultValues.sessionName || 'notebook1',
      memory: defaultValues.memory || 8,
      cores: defaultValues.cores || 2,
      // Advanced tab fields
      repositoryHost: 'images-rc.canfar.net',
      image: '',
      repositoryAuthUsername: 'janedoe',
      repositoryAuthSecret: '',
    });

    const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
      setTabValue(newValue);
    };

    const handleFieldChange = useCallback(
      (field: keyof SessionFormData) =>
        (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
          setFormData((prev) => ({
            ...prev,
            [field]:
              field === 'memory' || field === 'cores'
                ? Number(event.target.value)
                : event.target.value,
          }));
        },
      []
    );

    const handleSelectChange = useCallback(
      (field: keyof SessionFormData) => (event: SelectChangeEvent) => {
        setFormData((prev) => ({
          ...prev,
          [field]:
            field === 'memory' || field === 'cores'
              ? Number(event.target.value)
              : event.target.value,
        }));
      },
      []
    );

    const handleSubmit = useCallback(
      async (event: React.FormEvent) => {
        event.preventDefault();
        if (onLaunch) {
          await onLaunch(formData);
        }
      },
      [formData, onLaunch]
    );

    const handleReset = useCallback(() => {
      setFormData({
        type: defaultValues.type || 'notebook',
        project: defaultValues.project || 'skaha',
        containerImage: defaultValues.containerImage || DEFAULT_IMAGES[0],
        sessionName: defaultValues.sessionName || 'notebook1',
        memory: defaultValues.memory || 8,
        cores: defaultValues.cores || 2,
        // Advanced tab fields
        repositoryHost: 'images-rc.canfar.net',
        image: '',
        repositoryAuthUsername: 'janedoe',
        repositoryAuthSecret: '',
      });
      setResourceType('flexible');
      if (onReset) {
        onReset();
      }
    }, [defaultValues, onReset]);

    const handleResourceTypeChange = (
      event: React.ChangeEvent<HTMLInputElement>
    ) => {
      setResourceType(event.target.value as 'flexible' | 'fixed');
    };

    // Helper component for the help icon tooltip
    const HelpIcon = ({ title }: { title: string }) => (
      <Tooltip title={title} placement="top">
        <HelpOutlineIcon
          fontSize="small"
          sx={{
            ml: 0.5,
            color: theme.palette.primary.main,
            cursor: 'help',
            verticalAlign: 'middle',
          }}
        />
      </Tooltip>
    );

    return (
      <Card ref={ref} elevation={0}>
        <CardContent
          sx={{
            // Better mobile padding
            [theme.breakpoints.down('sm')]: {
              padding: theme.spacing(1.5),
              '&:last-child': {
                paddingBottom: theme.spacing(1.5),
              },
            },
          }}
        >
          <Box sx={{ borderBottom: 1, borderColor: theme.palette.divider }}>
            <Tabs
              value={tabValue}
              onChange={handleTabChange}
              aria-label="session launch tabs"
              variant="fullWidth"
              sx={{
                // Better mobile tab handling
                [theme.breakpoints.down('sm')]: {
                  minHeight: 40,
                  '& .MuiTab-root': {
                    minHeight: 40,
                    padding: theme.spacing(1, 1.5),
                    fontSize: theme.typography.body2.fontSize,
                  },
                },
                // Use scrollable tabs for very small screens if needed
                [theme.breakpoints.down('xs')]: {
                  variant: 'scrollable',
                  scrollButtons: 'auto',
                },
              }}
            >
              <Tab
                label="Standard"
                id="session-tab-0"
                aria-controls="session-tabpanel-0"
              />
              <Tab
                label="Advanced"
                id="session-tab-1"
                aria-controls="session-tabpanel-1"
              />
            </Tabs>
          </Box>

          {errorMessage && (
            <Alert severity="error" sx={{ mt: theme.spacing(2) }}>
              {errorMessage}
            </Alert>
          )}

          <form onSubmit={handleSubmit}>
            <TabPanel value={tabValue} index={0}>
              <Box
                sx={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: theme.spacing(2.5),
                }}
              >
                {/* Type field */}
                <Grid container alignItems="center" spacing={2}>
                  <Grid size={{ xs: 12, sm: 4 }}>
                    <FormLabel
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        fontSize: '0.875rem',
                        fontWeight: 500,
                      }}
                    >
                      type
                      <HelpIcon title="Select the type of session to launch" />
                    </FormLabel>
                  </Grid>
                  <Grid size={{ xs: 12, sm: 8 }}>
                    <Select
                      id="session-type"
                      value={formData.type}
                      onChange={
                        handleSelectChange('type') as React.ComponentProps<
                          typeof Select
                        >['onChange']
                      }
                      disabled={isLoading}
                      fullWidth
                      size="sm"
                    >
                      <MenuItem value="notebook">notebook</MenuItem>
                      <MenuItem value="desktop">desktop</MenuItem>
                      <MenuItem value="carta">carta</MenuItem>
                      <MenuItem value="contributed">contributed</MenuItem>
                      <MenuItem value="firefly">firefly</MenuItem>
                    </Select>
                  </Grid>
                </Grid>

                {/* Project field */}
                <Grid container alignItems="center" spacing={2}>
                  <Grid size={{ xs: 12, sm: 4 }}>
                    <FormLabel
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        fontSize: '0.875rem',
                        fontWeight: 500,
                      }}
                    >
                      project
                      <HelpIcon title="Select your project allocation" />
                    </FormLabel>
                  </Grid>
                  <Grid size={{ xs: 12, sm: 8 }}>
                    <Select
                      id="session-project"
                      value={formData.project}
                      onChange={
                        handleSelectChange('project') as React.ComponentProps<
                          typeof Select
                        >['onChange']
                      }
                      disabled={isLoading}
                      fullWidth
                      size="sm"
                    >
                      <MenuItem value="">
                        <em>Select project</em>
                      </MenuItem>
                      {projects.map((project) => (
                        <MenuItem key={project} value={project}>
                          {project}
                        </MenuItem>
                      ))}
                    </Select>
                  </Grid>
                </Grid>

                {/* Container Image field */}
                <Grid container alignItems="center" spacing={2}>
                  <Grid size={{ xs: 12, sm: 4 }}>
                    <FormLabel
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        fontSize: '0.875rem',
                        fontWeight: 500,
                      }}
                    >
                      container image
                      <HelpIcon title="Select the container image for your session" />
                    </FormLabel>
                  </Grid>
                  <Grid size={{ xs: 12, sm: 8 }}>
                    <Select
                      id="session-image"
                      value={formData.containerImage}
                      onChange={
                        handleSelectChange(
                          'containerImage'
                        ) as React.ComponentProps<typeof Select>['onChange']
                      }
                      disabled={isLoading}
                      fullWidth
                      size="sm"
                    >
                      {containerImages.map((image) => (
                        <MenuItem key={image} value={image}>
                          {image.replace('images-rc.canfar.net/skaha/', '')}
                        </MenuItem>
                      ))}
                    </Select>
                  </Grid>
                </Grid>

                {/* Session Name field */}
                <Grid container alignItems="center" spacing={2}>
                  <Grid size={{ xs: 12, sm: 4 }}>
                    <FormLabel
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        fontSize: '0.875rem',
                        fontWeight: 500,
                      }}
                    >
                      session name
                      <HelpIcon title="Enter a unique name for your session (max 15 characters)" />
                    </FormLabel>
                  </Grid>
                  <Grid size={{ xs: 12, sm: 8 }}>
                    <TextField
                      id="session-name"
                      value={formData.sessionName}
                      onChange={handleFieldChange('sessionName')}
                      disabled={isLoading}
                      inputProps={{ maxLength: 15 }}
                      placeholder="Enter session name"
                      fullWidth
                      size="sm"
                    />
                  </Grid>
                </Grid>

                {/* Resources field */}
                <Grid container alignItems="center" spacing={2}>
                  <Grid size={{ xs: 12, sm: 4 }}>
                    <FormLabel
                      sx={{
                        fontSize: '0.875rem',
                        fontWeight: 500,
                      }}
                    >
                      resources
                    </FormLabel>
                  </Grid>
                  <Grid size={{ xs: 12, sm: 8 }}>
                    <FormControl component="fieldset">
                      <RadioGroup
                        row
                        value={resourceType}
                        onChange={handleResourceTypeChange}
                      >
                        <FormControlLabel
                          value="flexible"
                          control={<Radio size="small" />}
                          label="Flexible"
                          disabled={isLoading}
                          sx={{ mr: 1 }}
                        />
                        <HelpIcon title="Flexible resources allow dynamic allocation based on availability" />
                        <FormControlLabel
                          value="fixed"
                          control={<Radio size="small" />}
                          label="Fixed"
                          disabled={isLoading}
                          sx={{ ml: 2, mr: 1 }}
                        />
                        <HelpIcon title="Fixed resources guarantee specific CPU and memory allocation" />
                      </RadioGroup>
                    </FormControl>
                  </Grid>
                </Grid>

                {/* Conditional Memory and CPU fields when Fixed is selected */}
                {resourceType === 'fixed' && (
                  <Grid container alignItems="center" spacing={2}>
                    <Grid size={{ xs: 12, sm: 4 }}>
                      {/* Empty grid for alignment */}
                    </Grid>
                    <Grid size={{ xs: 12, sm: 4 }}>
                      <FormLabel
                        sx={{
                          fontSize: '0.75rem',
                          fontWeight: 400,
                          mb: 0.5,
                        }}
                      >
                        Memory (GB)
                      </FormLabel>
                      <Select
                        id="session-memory"
                        value={String(formData.memory)}
                        onChange={
                          handleSelectChange('memory') as React.ComponentProps<
                            typeof Select
                          >['onChange']
                        }
                        disabled={isLoading}
                        fullWidth
                        size="sm"
                      >
                        {(memoryOptions || DEFAULT_MEMORY_OPTIONS).map(
                          (mem) => (
                            <MenuItem key={mem} value={String(mem)}>
                              {mem}
                            </MenuItem>
                          )
                        )}
                      </Select>
                    </Grid>
                    <Grid size={{ xs: 12, sm: 4 }}>
                      <FormLabel
                        sx={{
                          fontSize: '0.75rem',
                          fontWeight: 400,
                          mb: 0.5,
                        }}
                      >
                        CPU Cores
                      </FormLabel>
                      <Select
                        id="session-cores"
                        value={String(formData.cores)}
                        onChange={
                          handleSelectChange('cores') as React.ComponentProps<
                            typeof Select
                          >['onChange']
                        }
                        disabled={isLoading}
                        fullWidth
                        size="sm"
                      >
                        {(coreOptions || DEFAULT_CORE_OPTIONS).map((core) => (
                          <MenuItem key={core} value={String(core)}>
                            {core}
                          </MenuItem>
                        ))}
                      </Select>
                    </Grid>
                  </Grid>
                )}
              </Box>

              {/* Buttons */}
              <Grid container spacing={2}>
                <Grid size={{ xs: 12, sm: 4 }}>
                  {/* Empty grid for alignment */}
                </Grid>
                <Grid size={{ xs: 12, sm: 8 }}>
                  <Box sx={{ display: 'flex', gap: theme.spacing(2) }}>
                    <Button
                      type="submit"
                      variant="contained"
                      size="small"
                      disabled={isLoading || !formData.project}
                    >
                      Launch
                    </Button>
                    <Button
                      type="button"
                      variant="outlined"
                      size="small"
                      onClick={handleReset}
                      disabled={isLoading}
                    >
                      Reset
                    </Button>
                  </Box>
                </Grid>
              </Grid>
            </TabPanel>

            <TabPanel value={tabValue} index={1}>
              <Box>
                {/* Image access section */}
                <Box sx={{ mb: theme.spacing(4) }}>
                  <Typography
                    variant="subtitle2"
                    sx={{
                      fontWeight: 500,
                      mb: theme.spacing(1),
                      ml: theme.spacing(2),
                    }}
                  >
                    Image access
                  </Typography>
                  <Divider sx={{ mb: theme.spacing(3) }} />
                  <Box sx={{ px: theme.spacing(2) }}>
                    {/* Container image field */}
                    <Grid
                      container
                      alignItems="center"
                      spacing={2}
                      sx={{ mb: 2 }}
                    >
                      <Grid size={{ xs: 12, sm: 4 }}>
                        <FormLabel
                          sx={{
                            display: 'flex',
                            alignItems: 'center',
                            fontSize: '0.875rem',
                            fontWeight: 500,
                          }}
                        >
                          container image
                          <HelpIcon title="Specify a custom container image path" />
                        </FormLabel>
                      </Grid>
                      <Grid size={{ xs: 12, sm: 3 }}>
                        <TextField
                          id="repository-host"
                          value={formData.repositoryHost}
                          disabled
                          fullWidth
                          size="sm"
                        />
                      </Grid>
                      <Grid size={{ xs: 12, sm: 5 }}>
                        <TextField
                          id="image"
                          value={formData.image}
                          onChange={handleFieldChange('image')}
                          disabled={isLoading}
                          fullWidth
                          size="sm"
                          placeholder="project/example-image:1.0.0"
                        />
                      </Grid>
                    </Grid>

                    {/* Repository username field */}
                    <Grid
                      container
                      alignItems="center"
                      spacing={2}
                      sx={{ mb: 2 }}
                    >
                      <Grid size={{ xs: 12, sm: 4 }}>
                        <FormLabel
                          sx={{
                            display: 'flex',
                            alignItems: 'center',
                            fontSize: '0.875rem',
                            fontWeight: 500,
                          }}
                        >
                          repository username
                          <HelpIcon title="Username for private repository access" />
                        </FormLabel>
                      </Grid>
                      <Grid size={{ xs: 12, sm: 8 }}>
                        <TextField
                          id="repository-username"
                          value={formData.repositoryAuthUsername}
                          onChange={handleFieldChange('repositoryAuthUsername')}
                          disabled={isLoading}
                          fullWidth
                          size="sm"
                          placeholder="Repository username"
                          autoComplete="username"
                        />
                      </Grid>
                    </Grid>

                    {/* Repository secret field */}
                    <Grid container alignItems="center" spacing={2}>
                      <Grid size={{ xs: 12, sm: 4 }}>
                        <FormLabel
                          sx={{
                            display: 'flex',
                            alignItems: 'center',
                            fontSize: '0.875rem',
                            fontWeight: 500,
                          }}
                        >
                          repository secret
                          <HelpIcon title="Password or token for private repository" />
                        </FormLabel>
                      </Grid>
                      <Grid size={{ xs: 12, sm: 8 }}>
                        <TextField
                          id="repository-secret"
                          type="password"
                          value={formData.repositoryAuthSecret}
                          onChange={handleFieldChange('repositoryAuthSecret')}
                          disabled={isLoading}
                          fullWidth
                          size="sm"
                          placeholder="Repository secret"
                          autoComplete="current-password"
                        />
                      </Grid>
                    </Grid>
                  </Box>
                </Box>

                {/* Launch session section */}
                <Box>
                  <Typography
                    variant="subtitle2"
                    sx={{
                      fontWeight: 500,
                      mb: theme.spacing(1),
                      ml: theme.spacing(2),
                    }}
                  >
                    Launch session
                  </Typography>
                  <Divider sx={{ mb: theme.spacing(3) }} />
                  <Box sx={{ px: theme.spacing(2) }}>
                    {/* Type field */}
                    <Grid
                      container
                      alignItems="center"
                      spacing={2}
                      sx={{ mb: 2 }}
                    >
                      <Grid size={{ xs: 12, sm: 4 }}>
                        <FormLabel
                          sx={{
                            display: 'flex',
                            alignItems: 'center',
                            fontSize: '0.875rem',
                            fontWeight: 500,
                          }}
                        >
                          type
                          <HelpIcon title="Select the type of session to launch" />
                        </FormLabel>
                      </Grid>
                      <Grid size={{ xs: 12, sm: 8 }}>
                        <Select
                          id="advanced-session-type"
                          value={formData.type}
                          onChange={
                            handleSelectChange('type') as React.ComponentProps<
                              typeof Select
                            >['onChange']
                          }
                          disabled={isLoading}
                          fullWidth
                          size="sm"
                        >
                          <MenuItem value="notebook">notebook</MenuItem>
                          <MenuItem value="desktop">desktop</MenuItem>
                          <MenuItem value="carta">carta</MenuItem>
                          <MenuItem value="contributed">contributed</MenuItem>
                          <MenuItem value="firefly">firefly</MenuItem>
                        </Select>
                      </Grid>
                    </Grid>

                    {/* Session name field */}
                    <Grid container alignItems="center" spacing={2}>
                      <Grid size={{ xs: 12, sm: 4 }}>
                        <FormLabel
                          sx={{
                            display: 'flex',
                            alignItems: 'center',
                            fontSize: '0.875rem',
                            fontWeight: 500,
                          }}
                        >
                          session name
                          <HelpIcon title="Choose a unique name for your session (max 15 characters)" />
                        </FormLabel>
                      </Grid>
                      <Grid size={{ xs: 12, sm: 8 }}>
                        <TextField
                          id="advanced-session-name"
                          value={formData.sessionName}
                          onChange={handleFieldChange('sessionName')}
                          disabled={isLoading}
                          fullWidth
                          size="sm"
                          inputProps={{ maxLength: 15 }}
                          placeholder="Enter session name"
                        />
                      </Grid>
                    </Grid>
                  </Box>
                </Box>

                {/* Buttons */}
                <Grid container spacing={2} sx={{ mt: theme.spacing(3) }}>
                  <Grid size={{ xs: 12, sm: 4 }}>
                    {/* Empty grid for alignment */}
                  </Grid>
                  <Grid size={{ xs: 12, sm: 8 }}>
                    <Box sx={{ display: 'flex', gap: theme.spacing(2) }}>
                      <Button
                        type="submit"
                        variant="contained"
                        size="small"
                        disabled={isLoading}
                      >
                        Launch
                      </Button>
                      <Button
                        type="button"
                        variant="outlined"
                        size="small"
                        onClick={handleReset}
                        disabled={isLoading}
                      >
                        Reset
                      </Button>
                    </Box>
                  </Grid>
                </Grid>
              </Box>
            </TabPanel>
          </form>
        </CardContent>
      </Card>
    );
  }
);

SessionLaunchFormImpl.displayName = 'SessionLaunchFormImpl';
