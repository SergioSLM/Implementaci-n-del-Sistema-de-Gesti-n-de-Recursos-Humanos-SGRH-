import React from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Layout, Type, Image, Users, BarChart3, Trash2, Plus } from 'lucide-react';
import MediaPicker from '@/components/MediaPicker';
import { useBrand } from '@/contexts/BrandContext';
import { THEME_COLORS } from '@/hooks/use-appearance';
import { getImagePath } from '@/utils/helpers';

export default function AboutSection({ data, setData, errors, handleInputChange, getSectionData, updateSectionData, updateSectionVisibility, t = (key) => key }) {
  const { themeColor, customColor } = useBrand();
  const brandColor = themeColor === 'custom' ? customColor : THEME_COLORS[themeColor as keyof typeof THEME_COLORS];

  // Helper function to convert full URL to relative path for database storage
  const convertToRelativePath = (url: string): string => {
    if (!url) return url;
    if (!url.startsWith('http')) return url;
    const storageIndex = url.indexOf('/storage/');
    return storageIndex !== -1 ? url.substring(storageIndex) : url;
  };

  // Helper function to convert relative path to full URL for display
  const getDisplayUrl = (path: string): string => {
    if (!path) return path;
    if (path.startsWith('/screenshots/')) return `${window.appSettings.imageUrl}${path}`;
    return getImagePath(path);
  };
  return (
    <div className="space-y-6">
      {/* About Layout Subsection */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 pb-4 border-b border-gray-100 dark:border-gray-700/50 sm:border-0 sm:pb-0">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg shrink-0">
              <Layout className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">{t("About Layout")}</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">{t("Configure about section layout and positioning")}</p>
            </div>
          </div>
          <div className="flex items-center justify-between sm:justify-end gap-2 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-gray-100 dark:border-gray-700/50">
            <Label htmlFor="about_section_toggle" className="text-sm cursor-pointer">{t("Enable Section")}</Label>
            <Switch
              id="about_section_toggle"
              checked={data.config_sections?.section_visibility?.about !== false}
              onCheckedChange={(checked) => updateSectionVisibility('about', checked)}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-3">
            <Label htmlFor="about_layout">{t("Layout Style")}</Label>
            <select
              id="about_layout"
              name="about_layout"
              value={getSectionData('about').layout || 'image-right'}
              onChange={(e) => updateSectionData('about', { layout: e.target.value })}
              className="w-full p-2 border border-gray-300 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100 rounded-md cursor-pointer text-sm"
            >
              <option value="image-right" className='cursor-pointer'>{t("Content Left, Image Right")}</option>
              <option value="image-left" className='cursor-pointer'>{t("Image Left, Content Right")}</option>
              <option value="centered" className='cursor-pointer'>{t("Centered Content")}</option>
            </select>
          </div>

          <div className="space-y-3">
            <Label htmlFor="about_image_position">{t("Image Position")}</Label>
            <select
              id="about_image_position"
              name="about_image_position"
              value={getSectionData('about').image_position || 'right'}
              onChange={(e) => updateSectionData('about', { image_position: e.target.value })}
              className="w-full p-2 border border-gray-300 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100 rounded-md cursor-pointer text-sm"
            >
              <option value="right" className='cursor-pointer'>{t("Right Side")}</option>
              <option value="left" className='cursor-pointer'>{t("Left Side")}</option>
              <option value="background" className='cursor-pointer'>{t("Background")}</option>
            </select>
          </div>
        </div>
      </div>

      {/* About Content Subsection */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 shadow-sm">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg shrink-0">
            <Type className="h-5 w-5 text-green-600 dark:text-green-400" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">{t("About Content")}</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">{t("About section title, description and story")}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4">
          <div className="space-y-3">
            <Label htmlFor="about_title">{t("About Title")}</Label>
            <Input
              id="about_title"
              name="about_title"
              value={getSectionData('about').title || ''}
              onChange={(e) => updateSectionData('about', { title: e.target.value })}
              placeholder={t("About section title")}
              className="dark:bg-gray-900 dark:border-gray-700"
            />
            {errors.about_title && (
              <p className="text-red-600 text-sm">{errors.about_title}</p>
            )}
          </div>

          <div className="space-y-3">
            <Label htmlFor="about_description">{t("About Description")}</Label>
            <Textarea
              id="about_description"
              name="about_description"
              value={getSectionData('about').description || ''}
              onChange={(e) => updateSectionData('about', { description: e.target.value })}
              placeholder={t("Tell visitors about your company")}
              rows={4}
              className="dark:bg-gray-900 dark:border-gray-700 resize-none"
            />
            {errors.about_description && (
              <p className="text-red-600 text-sm">{errors.about_description}</p>
            )}
          </div>

          <div className="space-y-3">
            <Label htmlFor="about_story_title">{t("Story Title")}</Label>
            <Input
              id="about_story_title"
              name="about_story_title"
              value={getSectionData('about').story_title || ''}
              onChange={(e) => updateSectionData('about', { story_title: e.target.value })}
              placeholder={t("We are passionate about simplifying HR management for businesses of all sizes.")}
              className="dark:bg-gray-900 dark:border-gray-700"
            />
          </div>

          <div className="space-y-3">
            <Label htmlFor="about_story_content">{t("Story Content")}</Label>
            <Textarea
              id="about_story_content"
              name="about_story_content"
              value={getSectionData('about').story_content || ''}
              onChange={(e) => updateSectionData('about', { story_content: e.target.value })}
              placeholder={t("Founded by a team of networking enthusiasts...")}
              rows={4}
              className="dark:bg-gray-900 dark:border-gray-700 resize-none"
            />
          </div>
        </div>
      </div>

      {/* About Image & Style Subsection */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 shadow-sm">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg shrink-0">
            <Image className="h-5 w-5 text-purple-600 dark:text-purple-400" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">{t("About Image & Style")}</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">{t("Images, colors and visual effects")}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-3">
            <MediaPicker
              label={t("About Image")}
              value={getDisplayUrl(getSectionData('about').image || '')}
              onChange={(value) => {
                updateSectionData('about', { image: convertToRelativePath(value) });
              }}
              placeholder={t("Select about section image...")}
            />
          </div>

          <div className="space-y-3">
            <Label htmlFor="about_background_color">{t("Background Color")}</Label>
            <div className="flex gap-2">
              <Input
                id="about_background_color"
                name="about_background_color"
                type="color"
                value={getSectionData('about').background_color || '#f9fafb'}
                onChange={(e) => updateSectionData('about', { background_color: e.target.value })}
                className="w-16 h-10 p-1 cursor-pointer shrink-0"
              />
              <Input
                value={getSectionData('about').background_color || '#f9fafb'}
                onChange={(e) => updateSectionData('about', { background_color: e.target.value })}
                placeholder="#f9fafb"
                className="dark:bg-gray-900 dark:border-gray-700 flex-1 min-w-0"
              />
            </div>
          </div>

          <div className="space-y-3 sm:col-span-2 md:col-span-1">
            <div className="flex items-center justify-between gap-2">
              <Label htmlFor="about_parallax" className="cursor-pointer">{t("Parallax Effect")}</Label>
              <Switch
                id="about_parallax"
                name="about_parallax"
                checked={getSectionData('about').parallax || false}
                onCheckedChange={(checked) => updateSectionData('about', { parallax: checked })}
              />
            </div>
            <p className="text-xs text-muted-foreground">
              {t("Enable parallax scrolling effect")}
            </p>
          </div>
        </div>
      </div>

      {/* About Statistics Subsection */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 shadow-sm">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-orange-100 dark:bg-orange-900/30 rounded-lg shrink-0">
            <BarChart3 className="h-5 w-5 text-orange-600 dark:text-orange-400" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">{t("About Statistics")}</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">{t("Key metrics and achievements")}</p>
          </div>
        </div>

        <div className="space-y-4">
          {(getSectionData('about').stats || []).map((stat, index) => (
            <div key={index} className="bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 rounded-xl p-5">
              <div className="flex items-center justify-between mb-4">
                <h4 className="font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                  <span className="w-6 h-6 bg-orange-100 dark:bg-orange-900/40 text-orange-600 dark:text-orange-400 rounded-full flex items-center justify-center text-xs font-bold shrink-0">{index + 1}</span>
                  {t("Statistic")} {index + 1}
                </h4>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="text-gray-500 shrink-0"
                  onClick={() => {
                    const newStats = (getSectionData('about').stats || []).filter((_, i) => i !== index);
                    updateSectionData('about', { stats: newStats });
                  }}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-3">
                  <Label htmlFor={`about_stat_${index}_value`}>{t("Value")}</Label>
                  <Input
                    id={`about_stat_${index}_value`}
                    value={stat.value || ''}
                    onChange={(e) => {
                      const newStats = [...(getSectionData('about').stats || [])];
                      newStats[index] = { ...newStats[index], value: e.target.value };
                      updateSectionData('about', { stats: newStats });
                    }}
                    placeholder={t("4+ Years")}
                    className="dark:bg-gray-900 dark:border-gray-700"
                  />
                </div>
                <div className="space-y-3">
                  <Label htmlFor={`about_stat_${index}_label`}>{t("Label")}</Label>
                  <Input
                    id={`about_stat_${index}_label`}
                    value={stat.label || ''}
                    onChange={(e) => {
                      const newStats = [...(getSectionData('about').stats || [])];
                      newStats[index] = { ...newStats[index], label: e.target.value };
                      updateSectionData('about', { stats: newStats });
                    }}
                    placeholder={t("Experience")}
                    className="dark:bg-gray-900 dark:border-gray-700"
                  />
                </div>
                <div className="space-y-3">
                  <Label htmlFor={`about_stat_${index}_color`}>Color</Label>
                  <div className="flex gap-2">
                    <select
                      id={`about_stat_${index}_color`}
                      value={stat.color || 'blue'}
                      onChange={(e) => {
                        const newStats = [...(getSectionData('about').stats || [])];
                        newStats[index] = { ...newStats[index], color: e.target.value };
                        updateSectionData('about', { stats: newStats });
                      }}
                      className="w-full p-2 border border-gray-300 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100 rounded-md cursor-pointer text-sm"
                    >
                      <option value="blue" className='cursor-pointer'>Blue</option>
                      <option value="green" className='cursor-pointer'>Green</option>
                      <option value="purple" className='cursor-pointer'>Purple</option>
                      <option value="orange" className='cursor-pointer'>Orange</option>
                      <option value="red" className='cursor-pointer'>Red</option>
                      <option value="yellow" className='cursor-pointer'>Yellow</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>
          ))}

          <Button
            type="button"
            variant="outline"
            className="w-full border-2"
            style={{ color: brandColor, borderColor: brandColor }}
            onClick={() => {
              const newStats = [...(getSectionData('about').stats || []), { value: '', label: '', color: 'blue' }];
              updateSectionData('about', { stats: newStats });
            }}
          >
            <Plus className="h-4 w-4 mr-2" />
            {t('Add Statistic')}
          </Button>
        </div>
      </div>

      {/* About Values Subsection */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 shadow-sm">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-teal-100 dark:bg-teal-900/30 rounded-lg shrink-0">
            <Users className="h-5 w-5 text-teal-600 dark:text-teal-400" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">{t("About Values")}</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">{t("Company values and mission statements")}</p>
          </div>
        </div>

        <div className="space-y-4">
          {(getSectionData('about').values || []).map((value, index) => (
            <div key={index} className="bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 rounded-xl p-5">
              <div className="flex items-center justify-between mb-4">
                <h4 className="font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                  <span className="w-6 h-6 bg-teal-100 dark:bg-teal-900/40 text-teal-600 dark:text-teal-400 rounded-full flex items-center justify-center text-xs font-bold shrink-0">{index + 1}</span>
                  {t("Value")} {index + 1}
                </h4>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200 shrink-0"
                  onClick={() => {
                    const newValues = (getSectionData('about').values || []).filter((_, i) => i !== index);
                    updateSectionData('about', { values: newValues });
                  }}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="space-y-3">
                  <Label htmlFor={`about_value_${index}_title`}>{t("Title")}</Label>
                  <Input
                    id={`about_value_${index}_title`}
                    value={value.title || ''}
                    onChange={(e) => {
                      const newValues = [...(getSectionData('about').values || [])];
                      newValues[index] = { ...newValues[index], title: e.target.value };
                      updateSectionData('about', { values: newValues });
                    }}
                    placeholder="Our Mission"
                    className="dark:bg-gray-900 dark:border-gray-700"
                  />
                </div>

                <div className="space-y-3">
                  <Label htmlFor={`about_value_${index}_icon`}>{t("Icon")}</Label>
                  <select
                    id={`about_value_${index}_icon`}
                    value={value.icon || 'target'}
                    onChange={(e) => {
                      const newValues = [...(getSectionData('about').values || [])];
                      newValues[index] = { ...newValues[index], icon: e.target.value };
                      updateSectionData('about', { values: newValues });
                    }}
                    className="w-full p-2 border border-gray-300 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100 rounded-md cursor-pointer text-sm"
                  >
                    <option value="target" className='cursor-pointer'>Target</option>
                    <option value="heart" className='cursor-pointer'>Heart</option>
                    <option value="award" className='cursor-pointer'>Award</option>
                    <option value="lightbulb" className='cursor-pointer'>Lightbulb</option>
                    <option value="star" className='cursor-pointer'>Star</option>
                    <option value="shield" className='cursor-pointer'>Shield</option>
                    <option value="users" className='cursor-pointer'>Users</option>
                    <option value="zap" className='cursor-pointer'>Zap</option>
                  </select>
                </div>

                <div className="space-y-3 sm:col-span-2 lg:col-span-1">
                  <Label htmlFor={`about_value_${index}_description`}>{t("Description")}</Label>
                  <Textarea
                    id={`about_value_${index}_description`}
                    value={value.description || ''}
                    onChange={(e) => {
                      const newValues = [...(getSectionData('about').values || [])];
                      newValues[index] = { ...newValues[index], description: e.target.value };
                      updateSectionData('about', { values: newValues });
                    }}
                    placeholder="To revolutionize professional networking..."
                    rows={3}
                    className="dark:bg-gray-900 dark:border-gray-700 resize-none"
                  />
                </div>
              </div>
            </div>
          ))}

          <Button
            type="button"
            variant="outline"
            className="w-full border-2"
            style={{ color: brandColor, borderColor: brandColor }}
            onClick={() => {
              const newValues = [...(getSectionData('about').values || []), { title: '', description: '', icon: 'target' }];
              updateSectionData('about', { values: newValues });
            }}
          >
            <Plus className="h-4 w-4 mr-2" />
            {t('Add Value')}
          </Button>
        </div>
      </div>

      {/* Image Section Subsection */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 shadow-sm">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-pink-100 dark:bg-pink-900/30 rounded-lg shrink-0">
            <Image className="h-5 w-5 text-pink-600 dark:text-pink-400" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">{t("Image Section")}</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">{t("Image overlay content and icons")}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          <div className="space-y-3">
            <Label htmlFor="about_image_title">{t("Image Title")}</Label>
            <Input
              id="about_image_title"
              name="about_image_title"
              value={getSectionData('about').image_title || ''}
              onChange={(e) => updateSectionData('about', { image_title: e.target.value })}
              placeholder="Innovation Driven"
              className="dark:bg-gray-900 dark:border-gray-700"
            />
          </div>

          <div className="space-y-3">
            <Label htmlFor="about_image_subtitle">{t("Image Subtitle")}</Label>
            <Input
              id="about_image_subtitle"
              name="about_image_subtitle"
              value={getSectionData('about').image_subtitle || ''}
              onChange={(e) => updateSectionData('about', { image_subtitle: e.target.value })}
              placeholder="Building the future of networking"
              className="dark:bg-gray-900 dark:border-gray-700"
            />
          </div>

          <div className="space-y-3 sm:col-span-2 md:col-span-1">
            <Label htmlFor="about_image_icon">{t("Image Icon")}</Label>
            <Input
              id="about_image_icon"
              name="about_image_icon"
              value={getSectionData('about').image_icon || ''}
              onChange={(e) => updateSectionData('about', { image_icon: e.target.value })}
              placeholder="🚀"
              maxLength={5}
              className="dark:bg-gray-900 dark:border-gray-700"
            />
          </div>
        </div>
      </div>
    </div>
  );
}