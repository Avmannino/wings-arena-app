import AsyncStorage from "@react-native-async-storage/async-storage";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import {
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

import Ionicons from "@expo/vector-icons/Ionicons";

import {
  useIsFocused,
} from "@react-navigation/native";

import {
  SafeAreaView,
} from "react-native-safe-area-context";

import Collapsible from "../components/Collapsible";

import {
  INVENTORY_CATALOG,
} from "../data/inventoryCatalog";

import {
  fetchFacilities,
  SYNC_ENABLED,
  sendFacilitiesOp,
} from "../services/facilitiesApi";

import {
  colors,
} from "../theme";

const STORAGE_KEY =
  "wings-arena-facilities-v2";

const POLL_MS = 20000;

const EMPTY_DATA = {
  items: [],
  inventory: {},
};

const STATUS_OPTIONS = [
  {
    key: "low",
    label: "LOW",
    color: colors.yellow,
    soft: colors.yellowSoft,
  },

  {
    key: "out",
    label: "OUT",
    color: colors.wings,
    soft: colors.wingsSoft,
  },
];

function getStatusOption(key) {
  return (
    STATUS_OPTIONS.find(
      (option) =>
        option.key === key
    ) || STATUS_OPTIONS[1]
  );
}

function confirmAction(
  title,
  message,
  confirmLabel,
  onConfirm
) {
  if (Platform.OS === "web") {
    if (
      typeof window !==
        "undefined" &&
      window.confirm(
        `${title}\n${message}`
      )
    ) {
      onConfirm();
    }

    return;
  }

  Alert.alert(title, message, [
    {
      text: "Cancel",
      style: "cancel",
    },

    {
      text: confirmLabel,
      style: "destructive",
      onPress: onConfirm,
    },
  ]);
}

function formatAdded(timestamp) {
  return new Intl.DateTimeFormat(
    "en-US",
    {
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    }
  ).format(new Date(timestamp));
}

function collectIds(item) {
  return [
    item.id,
    ...(item.options || []).map(
      (option) => option.id
    ),
  ];
}

function StatusToggle({
  option,
  checked,
  onPress,
  label,
}) {
  return (
    <Pressable
      onPress={onPress}
      hitSlop={6}
      accessibilityRole="checkbox"
      accessibilityState={{
        checked,
      }}
      accessibilityLabel={`${label} ${option.label}`}
      style={styles.toggle}
    >
      <View
        style={[
          styles.toggleBox,
          checked && {
            backgroundColor:
              option.color,
            borderColor:
              option.color,
          },
        ]}
      >
        {checked ? (
          <Ionicons
            name="checkmark"
            size={14}
            color={
              colors.background
            }
          />
        ) : null}
      </View>

      <Text
        style={[
          styles.toggleLabel,
          checked && {
            color: option.color,
          },
        ]}
      >
        {option.label}
      </Text>
    </Pressable>
  );
}

function InventoryRow({
  name,
  status,
  onToggle,
  nested = false,
  expandable = false,
  expanded = false,
  lowCount = 0,
  outCount = 0,
  onPressHeader,
}) {
  const flagged =
    status === "low" ||
    status === "out";

  const option = flagged
    ? getStatusOption(status)
    : null;

  if (expandable) {
    return (
      <Pressable
        onPress={onPressHeader}
        accessibilityRole="button"
        accessibilityState={{
          expanded,
        }}
        accessibilityLabel={`${name} flavors`}
        style={[
          styles.inventoryRow,
          expanded &&
            styles.inventoryRowExpanded,
        ]}
      >
        <Text
          style={[
            styles.inventoryName,
            styles.inventoryNameHeader,
          ]}
          numberOfLines={2}
        >
          {name}
        </Text>

        <View
          style={styles.rowArrow}
        >
          {outCount > 0 ? (
            <View
              style={[
                styles.countPill,
                {
                  borderColor:
                    colors.wings,
                  backgroundColor:
                    colors.wingsSoft,
                },
              ]}
            >
              <Text
                style={[
                  styles.countPillText,
                  {
                    color:
                      colors.wings,
                  },
                ]}
              >
                {outCount} OUT
              </Text>
            </View>
          ) : null}

          {lowCount > 0 ? (
            <View
              style={[
                styles.countPill,
                {
                  borderColor:
                    colors.yellow,
                  backgroundColor:
                    colors.yellowSoft,
                },
              ]}
            >
              <Text
                style={[
                  styles.countPillText,
                  {
                    color:
                      colors.yellow,
                  },
                ]}
              >
                {lowCount} LOW
              </Text>
            </View>
          ) : null}

          <Ionicons
            name={
              expanded
                ? "chevron-up"
                : "chevron-down"
            }
            size={20}
            color={
              colors.textSecondary
            }
          />
        </View>
      </Pressable>
    );
  }

  return (
    <View
      style={[
        styles.inventoryRow,
        nested &&
          styles.inventoryRowNested,
        flagged && {
          borderColor:
            option.color,
          backgroundColor:
            option.soft,
        },
      ]}
    >
      <Text
        style={[
          styles.inventoryName,
          nested &&
            styles.inventoryNameNested,
        ]}
        numberOfLines={2}
      >
        {name}
      </Text>

      <View
        style={styles.toggleGroup}
      >
        {STATUS_OPTIONS.map(
          (statusOption) => (
            <StatusToggle
              key={
                statusOption.key
              }
              option={
                statusOption
              }
              label={name}
              checked={
                status ===
                statusOption.key
              }
              onPress={() =>
                onToggle(
                  statusOption.key
                )
              }
            />
          )
        )}
      </View>
    </View>
  );
}

function CategorySection({
  category,
  inventory,
  onToggle,
}) {
  const [
    collapsed,
    setCollapsed,
  ] = useState(false);

  const [
    expanded,
    setExpanded,
  ] = useState({});

  const toggleExpanded =
    (id) => {
      setExpanded(
        (current) => ({
          ...current,
          [id]: !current[id],
        })
      );
    };

  const flaggedCount =
    category.items.reduce(
      (count, item) =>
        count +
        collectIds(item).filter(
          (id) => inventory[id]
        ).length,
      0
    );

  return (
    <View
      style={styles.category}
    >
      <Pressable
        onPress={() =>
          setCollapsed(
            (value) => !value
          )
        }
        style={
          styles.categoryHeader
        }
        accessibilityRole="button"
        accessibilityLabel={`${collapsed ? "Expand" : "Collapse"} ${category.title}`}
      >
        <Text
          style={
            styles.categoryTitle
          }
        >
          {category.title.toUpperCase()}
        </Text>

        <View
          style={
            styles.categoryRight
          }
        >
          {flaggedCount > 0 ? (
            <Text
              style={
                styles.categoryFlagged
              }
            >
              {flaggedCount}{" "}
              flagged
            </Text>
          ) : null}

          <Ionicons
            name={
              collapsed
                ? "chevron-down"
                : "chevron-up"
            }
            size={16}
            color={colors.muted}
          />
        </View>
      </Pressable>

      <Collapsible
        expanded={!collapsed}
      >
        <View
          style={
            styles.categoryBody
          }
        >
          {category.items.map(
            (item) => {
              const hasOptions =
                !!item.options;

              const isExpanded =
                !!expanded[
                  item.id
                ];

              return (
                <View
                  key={item.id}
                >
                  <InventoryRow
                    name={
                      item.name
                    }
                    expandable={
                      hasOptions
                    }
                    expanded={
                      isExpanded
                    }
                    lowCount={
                      hasOptions
                        ? item.options.filter(
                            (option) =>
                              inventory[
                                option
                                  .id
                              ] ===
                              "low"
                          ).length
                        : 0
                    }
                    outCount={
                      hasOptions
                        ? item.options.filter(
                            (option) =>
                              inventory[
                                option
                                  .id
                              ] ===
                              "out"
                          ).length
                        : 0
                    }
                    onPressHeader={() =>
                      toggleExpanded(
                        item.id
                      )
                    }
                    status={
                      inventory[
                        item.id
                      ]
                    }
                    onToggle={(
                      flag
                    ) =>
                      onToggle(
                        item.id,
                        flag
                      )
                    }
                  />

                  {hasOptions ? (
                    <Collapsible
                      expanded={
                        isExpanded
                      }
                    >
                    <View
                      style={
                        styles.sublist
                      }
                    >
                      {item.options.map(
                        (option) => (
                          <InventoryRow
                            key={
                              option.id
                            }
                            nested
                            name={
                              option.name
                            }
                            status={
                              inventory[
                                option
                                  .id
                              ]
                            }
                            onToggle={(
                              flag
                            ) =>
                              onToggle(
                                option.id,
                                flag
                              )
                            }
                          />
                        )
                      )}
                    </View>
                    </Collapsible>
                  ) : null}
                </View>
              );
            }
          )}
        </View>
      </Collapsible>
    </View>
  );
}

export default function FacilitiesScreen({
  navigation,
}) {
  const isFocused =
    useIsFocused();

  const [data, setData] =
    useState(EMPTY_DATA);

  const [loaded, setLoaded] =
    useState(false);

  const [
    errorMessage,
    setErrorMessage,
  ] = useState("");

  const [name, setName] =
    useState("");

  const [note, setNote] =
    useState("");

  const [level, setLevel] =
    useState("out");

  const pendingRef =
    useRef(0);

  useEffect(() => {
    let active = true;

    AsyncStorage.getItem(
      STORAGE_KEY
    )
      .then((stored) => {
        if (active && stored) {
          setData({
            ...EMPTY_DATA,
            ...JSON.parse(
              stored
            ),
          });
        }
      })
      .catch(() => {})
      .finally(() => {
        if (active) {
          setLoaded(true);
        }
      });

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (!loaded) {
      return;
    }

    AsyncStorage.setItem(
      STORAGE_KEY,
      JSON.stringify(data)
    ).catch(() => {});
  }, [data, loaded]);

  const refresh =
    useCallback(async () => {
      if (
        !SYNC_ENABLED ||
        pendingRef.current > 0
      ) {
        return;
      }

      try {
        const remote =
          await fetchFacilities();

        if (
          pendingRef.current > 0
        ) {
          return;
        }

        setData(remote);
        setErrorMessage("");
      } catch (error) {
        setErrorMessage(
          error.message ||
            "Couldn't reach the shared list."
        );
      }
    }, []);

  useEffect(() => {
    if (
      !SYNC_ENABLED ||
      !isFocused ||
      !loaded
    ) {
      return undefined;
    }

    refresh();

    const interval =
      setInterval(
        refresh,
        POLL_MS
      );

    return () =>
      clearInterval(interval);
  }, [
    isFocused,
    loaded,
    refresh,
  ]);

  const mutate =
    useCallback(
      async (updater, op) => {
        setData(updater);

        if (!SYNC_ENABLED) {
          return;
        }

        pendingRef.current += 1;

        try {
          const remote =
            await sendFacilitiesOp(
              op
            );

          pendingRef.current -= 1;

          if (
            pendingRef.current ===
            0
          ) {
            setData(remote);
            setErrorMessage("");
          }
        } catch (error) {
          pendingRef.current -= 1;

          setErrorMessage(
            "Couldn't save that change. Showing the latest shared list."
          );

          refresh();
        }
      },

      [refresh]
    );

  const toggleInventory =
    useCallback(
      (id, flag) => {
        const current =
          data.inventory[id];

        const next =
          current === flag
            ? "ok"
            : flag;

        mutate(
          (state) => {
            const inventory = {
              ...state.inventory,
            };

            if (next === "ok") {
              delete inventory[id];
            } else {
              inventory[id] =
                next;
            }

            return {
              ...state,
              inventory,
            };
          },
          {
            action: "setStatus",
            id,
            status: next,
          }
        );
      },

      [data.inventory, mutate]
    );

  const addItem =
    useCallback(() => {
      const trimmed =
        name.trim();

      if (!trimmed) {
        return;
      }

      const item = {
        id: `${Date.now()}-${Math.random()
          .toString(36)
          .slice(2, 7)}`,
        name: trimmed,
        note: note.trim(),
        level,
        ordered: false,
        addedAt: Date.now(),
      };

      mutate(
        (state) => ({
          ...state,
          items: [
            item,
            ...state.items,
          ],
        }),
        {
          action: "add",
          item,
        }
      );

      setName("");
      setNote("");
    }, [
      name,
      note,
      level,
      mutate,
    ]);

  const toggleOrdered =
    useCallback(
      (item) => {
        const ordered =
          !item.ordered;

        mutate(
          (state) => ({
            ...state,
            items:
              state.items.map(
                (entry) =>
                  entry.id ===
                  item.id
                    ? {
                        ...entry,
                        ordered,
                      }
                    : entry
              ),
          }),
          {
            action:
              "setOrdered",
            id: item.id,
            ordered,
          }
        );
      },

      [mutate]
    );

  const removeItem =
    useCallback(
      (item) => {
        confirmAction(
          "Delete item?",
          `Remove "${item.name}" from the list${SYNC_ENABLED ? " for everyone" : ""}?`,
          "Delete",
          () =>
            mutate(
              (state) => ({
                ...state,
                items:
                  state.items.filter(
                    (entry) =>
                      entry.id !==
                      item.id
                  ),
              }),
              {
                action:
                  "delete",
                id: item.id,
              }
            )
        );
      },

      [mutate]
    );

  const clearOrdered =
    useCallback(() => {
      confirmAction(
        "Clear ordered items?",
        `Remove every ordered item${SYNC_ENABLED ? " for everyone" : ""}?`,
        "Clear",
        () =>
          mutate(
            (state) => ({
              ...state,
              items:
                state.items.filter(
                  (entry) =>
                    !entry.ordered
                ),
            }),
            {
              action:
                "clearOrdered",
            }
          )
      );
    }, [mutate]);

  const clearInventory =
    useCallback(() => {
      confirmAction(
        "Clear all checks?",
        `Reset every LOW and OUT checkbox${SYNC_ENABLED ? " for everyone" : ""}? Items under Other Items aren't affected.`,
        "Clear all",
        () =>
          mutate(
            (state) => ({
              ...state,
              inventory: {},
            }),
            {
              action:
                "clearInventory",
            }
          )
      );
    }, [mutate]);

  const sortedItems =
    useMemo(
      () =>
        [...data.items].sort(
          (a, b) => {
            if (
              a.ordered !==
              b.ordered
            ) {
              return a.ordered
                ? 1
                : -1;
            }

            if (
              a.level !==
              b.level
            ) {
              return a.level ===
                "out"
                ? -1
                : 1;
            }

            return (
              b.addedAt -
              a.addedAt
            );
          }
        ),

      [data.items]
    );

  const orderedCount =
    data.items.filter(
      (item) => item.ordered
    ).length;

  const summary =
    useMemo(() => {
      let out = 0;
      let low = 0;

      Object.values(
        data.inventory
      ).forEach((status) => {
        if (status === "out") {
          out += 1;
        } else if (
          status === "low"
        ) {
          low += 1;
        }
      });

      data.items.forEach(
        (item) => {
          if (item.ordered) {
            return;
          }

          if (
            item.level === "low"
          ) {
            low += 1;
          } else {
            out += 1;
          }
        }
      );

      return { out, low };
    }, [data]);

  return (
    <SafeAreaView
      style={styles.safeArea}
      edges={["top"]}
    >
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={
          Platform.OS === "ios"
            ? "padding"
            : undefined
        }
      >
        <ScrollView
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={
            styles.content
          }
          showsVerticalScrollIndicator={
            false
          }
        >
          <Pressable
            style={
              styles.headerLogoButton
            }
            onPress={() =>
              navigation.navigate(
                "Home"
              )
            }
            accessibilityRole="button"
            accessibilityLabel="Go to home"
          >
            <Image
              source={require(
                "../../assets/wings-logo.png"
              )}
              style={
                styles.headerLogo
              }
              resizeMode="contain"
            />
          </Pressable>

          <Text
            style={styles.title}
          >
            Facilities
          </Text>

          <Text
            style={
              styles.subtitle
            }
          >
            {SYNC_ENABLED
              ? "Inventory checklist · shared with everyone using the app"
              : "Inventory checklist · saved on this device only (sharing not set up yet)"}
          </Text>

          {errorMessage ? (
            <Text
              style={
                styles.errorText
              }
            >
              {errorMessage}
            </Text>
          ) : null}

          <View
            style={
              styles.summaryRow
            }
          >
            <View
              style={[
                styles.summaryChip,
                {
                  borderColor:
                    colors.wings,
                  backgroundColor:
                    colors.wingsSoft,
                },
              ]}
            >
              <Text
                style={[
                  styles.summaryText,
                  {
                    color:
                      colors.wings,
                  },
                ]}
              >
                {summary.out} OUT
              </Text>
            </View>

            <View
              style={[
                styles.summaryChip,
                {
                  borderColor:
                    colors.yellow,
                  backgroundColor:
                    colors.yellowSoft,
                },
              ]}
            >
              <Text
                style={[
                  styles.summaryText,
                  {
                    color:
                      colors.yellow,
                  },
                ]}
              >
                {summary.low} LOW
              </Text>
            </View>

          {Object.keys(
            data.inventory
          ).length > 0 ? (
            <Pressable
              onPress={
                clearInventory
              }
              style={
                styles.clearAllButton
              }
              accessibilityRole="button"
              accessibilityLabel="Clear all checks"
            >
              <Text
                style={
                  styles.clearAllText
                }
              >
                CLEAR ALL
              </Text>
            </Pressable>
          ) : null}
          </View>

          {INVENTORY_CATALOG.map(
            (category) => (
              <CategorySection
                key={
                  category.key
                }
                category={
                  category
                }
                inventory={
                  data.inventory
                }
                onToggle={
                  toggleInventory
                }
              />
            )
          )}

          <View
            style={
              styles.category
            }
          >
            <View
              style={
                styles.categoryHeader
              }
            >
              <Text
                style={
                  styles.categoryTitle
                }
              >
                OTHER ITEMS
              </Text>

              <Text
                style={
                  styles.categoryHint
                }
              >
                Not on the lists above
              </Text>
            </View>

            <View
              style={
                styles.addCard
              }
            >
              <TextInput
                style={
                  styles.input
                }
                value={name}
                onChangeText={
                  setName
                }
                placeholder="Item (e.g. Zamboni blades)"
                placeholderTextColor={
                  colors.muted
                }
                returnKeyType="next"
                maxLength={80}
              />

              <TextInput
                style={[
                  styles.input,
                  styles.noteInput,
                ]}
                value={note}
                onChangeText={
                  setNote
                }
                placeholder="Note or quantity (optional)"
                placeholderTextColor={
                  colors.muted
                }
                returnKeyType="done"
                onSubmitEditing={
                  addItem
                }
                maxLength={120}
              />

              <View
                style={
                  styles.addRow
                }
              >
                <View
                  style={
                    styles.levelRow
                  }
                >
                  {[
                    ...STATUS_OPTIONS,
                  ]
                    .reverse()
                    .map(
                      (option) => {
                        const selected =
                          option.key ===
                          level;

                        return (
                          <Pressable
                            key={
                              option.key
                            }
                            onPress={() =>
                              setLevel(
                                option.key
                              )
                            }
                            style={[
                              styles.levelChip,
                              {
                                borderColor:
                                  selected
                                    ? option.color
                                    : colors.border,
                                backgroundColor:
                                  selected
                                    ? option.soft
                                    : "transparent",
                              },
                            ]}
                          >
                            <Text
                              style={[
                                styles.levelChipText,
                                {
                                  color:
                                    selected
                                      ? option.color
                                      : colors.muted,
                                },
                              ]}
                            >
                              {
                                option.label
                              }
                            </Text>
                          </Pressable>
                        );
                      }
                    )}
                </View>

                <Pressable
                  onPress={
                    addItem
                  }
                  disabled={
                    !name.trim()
                  }
                  style={[
                    styles.addButton,
                    !name.trim() &&
                      styles.addButtonDisabled,
                  ]}
                >
                  <Ionicons
                    name="add"
                    size={18}
                    color={
                      colors.text
                    }
                  />

                  <Text
                    style={
                      styles.addButtonText
                    }
                  >
                    ADD
                  </Text>
                </Pressable>
              </View>
            </View>

            {orderedCount > 0 ? (
              <Pressable
                onPress={
                  clearOrdered
                }
                style={
                  styles.clearButton
                }
              >
                <Text
                  style={
                    styles.clearButtonText
                  }
                >
                  CLEAR{" "}
                  {orderedCount}{" "}
                  ORDERED
                </Text>
              </Pressable>
            ) : null}

            {sortedItems.length ===
            0 ? (
              <Text
                style={
                  styles.emptyText
                }
              >
                Nothing added yet.
              </Text>
            ) : (
              sortedItems.map(
                (item) => {
                  const itemLevel =
                    getStatusOption(
                      item.level
                    );

                  return (
                    <View
                      key={
                        item.id
                      }
                      style={[
                        styles.itemRow,
                        item.ordered &&
                          styles.itemRowOrdered,
                      ]}
                    >
                      <Pressable
                        onPress={() =>
                          toggleOrdered(
                            item
                          )
                        }
                        hitSlop={8}
                        accessibilityRole="checkbox"
                        accessibilityState={{
                          checked:
                            item.ordered,
                        }}
                        accessibilityLabel={`Mark ${item.name} ordered`}
                        style={[
                          styles.checkbox,
                          item.ordered &&
                            styles.checkboxChecked,
                        ]}
                      >
                        {item.ordered ? (
                          <Ionicons
                            name="checkmark"
                            size={
                              16
                            }
                            color={
                              colors.background
                            }
                          />
                        ) : null}
                      </Pressable>

                      <View
                        style={
                          styles.itemBody
                        }
                      >
                        <Text
                          style={[
                            styles.itemName,
                            item.ordered &&
                              styles.itemNameOrdered,
                          ]}
                        >
                          {
                            item.name
                          }
                        </Text>

                        {item.note ? (
                          <Text
                            style={
                              styles.itemNote
                            }
                          >
                            {
                              item.note
                            }
                          </Text>
                        ) : null}

                        <Text
                          style={
                            styles.itemMeta
                          }
                        >
                          {item.ordered
                            ? "ORDERED · "
                            : ""}
                          {formatAdded(
                            item.addedAt
                          )}
                        </Text>
                      </View>

                      <View
                        style={[
                          styles.levelBadge,
                          {
                            borderColor:
                              itemLevel.color,
                            backgroundColor:
                              itemLevel.soft,
                          },
                        ]}
                      >
                        <Text
                          style={[
                            styles.levelBadgeText,
                            {
                              color:
                                itemLevel.color,
                            },
                          ]}
                        >
                          {
                            itemLevel.label
                          }
                        </Text>
                      </View>

                      <Pressable
                        onPress={() =>
                          removeItem(
                            item
                          )
                        }
                        hitSlop={8}
                        accessibilityRole="button"
                        accessibilityLabel={`Delete ${item.name}`}
                      >
                        <Ionicons
                          name="trash-outline"
                          size={
                            18
                          }
                          color={
                            colors.muted
                          }
                        />
                      </Pressable>
                    </View>
                  );
                }
              )
            )}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles =
  StyleSheet.create({
    safeArea: {
      flex: 1,
      backgroundColor:
        colors.background,
    },

    flex: {
      flex: 1,
    },

    content: {
      paddingHorizontal: 20,
      paddingTop: 12,
      paddingBottom: 48,
    },

    headerLogoButton: {
      alignSelf: "flex-start",
    },

    headerLogo: {
      height: 31,
      width: 31 * (1925 / 342),
      marginBottom: 16,
    },

    title: {
      color: colors.text,
      fontSize: 23,
      fontWeight: "700",
      letterSpacing: -0.6,
    },

    subtitle: {
      color: colors.muted,
      fontSize: 12,
      marginTop: 4,
      lineHeight: 17,
    },

    errorText: {
      color: colors.red,
      fontSize: 11,
      fontWeight: "600",
      marginTop: 8,
    },

    summaryRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
      marginTop: 14,
    },

    summaryChip: {
      borderWidth: 1,
      borderRadius: 999,
      paddingHorizontal: 12,
      paddingVertical: 5,
    },

    summaryText: {
      fontSize: 11,
      fontWeight: "800",
      letterSpacing: 1,
    },

    clearAllButton: {
      marginLeft: "auto",
      borderWidth: 1,
      borderColor: colors.borderLight,
      borderRadius: 999,
      paddingHorizontal: 12,
      paddingVertical: 5,
    },

    clearAllText: {
      color: colors.textSecondary,
      fontSize: 10,
      fontWeight: "800",
      letterSpacing: 1.2,
    },

    category: {
      marginTop: 24,
    },

    categoryHeader: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent:
        "space-between",
      paddingBottom: 8,
      borderBottomWidth: 1,
      borderBottomColor:
        colors.border,
    },

    categoryTitle: {
      color: colors.textSecondary,
      fontSize: 13,
      fontWeight: "800",
      letterSpacing: 1.4,
    },

    categoryRight: {
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
    },

    categoryFlagged: {
      color: colors.textSecondary,
      fontSize: 11,
      fontWeight: "600",
    },

    categoryHint: {
      color: colors.muted,
      fontSize: 11,
    },

    categoryBody: {
      marginTop: 10,
      gap: 8,
    },

    inventoryRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent:
        "space-between",
      gap: 12,
      backgroundColor:
        colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 12,
      paddingHorizontal: 14,
      paddingVertical: 11,
    },

    inventoryRowNested: {
      paddingVertical: 9,
    },

    inventoryRowExpanded: {
      borderColor:
        colors.borderLight,
    },

    sublist: {
      marginTop: 6,
      marginLeft: 14,
      paddingLeft: 10,
      gap: 6,
      borderLeftWidth: 2,
      borderLeftColor:
        colors.borderLight,
    },

    rowArrow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
    },

    countPill: {
      borderWidth: 1,
      borderRadius: 999,
      paddingHorizontal: 9,
      paddingVertical: 3,
    },

    countPillText: {
      fontSize: 10,
      fontWeight: "800",
      letterSpacing: 0.8,
    },

    inventoryName: {
      flex: 1,
      color: colors.text,
      fontSize: 15,
      fontWeight: "700",
    },

    inventoryNameNested: {
      fontSize: 14,
      fontWeight: "600",
    },

    inventoryNameHeader: {
      color: colors.textSecondary,
      fontSize: 13,
      fontWeight: "800",
      letterSpacing: 0.4,
    },

    toggleGroup: {
      flexDirection: "row",
      gap: 14,
    },

    toggle: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
    },

    toggleBox: {
      width: 22,
      height: 22,
      alignItems: "center",
      justifyContent: "center",
      borderWidth: 1.5,
      borderColor:
        colors.borderLight,
      borderRadius: 6,
    },

    toggleLabel: {
      color: colors.muted,
      fontSize: 10,
      fontWeight: "800",
      letterSpacing: 0.8,
    },

    addCard: {
      marginTop: 12,
      padding: 14,
      gap: 10,
      backgroundColor:
        colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 14,
    },

    input: {
      color: colors.text,
      fontSize: 15,
      backgroundColor:
        colors.background,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 10,
      paddingHorizontal: 12,
      paddingVertical: 10,
    },

    noteInput: {
      fontSize: 13,
    },

    addRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent:
        "space-between",
    },

    levelRow: {
      flexDirection: "row",
      gap: 8,
    },

    levelChip: {
      borderWidth: 1,
      borderRadius: 999,
      paddingHorizontal: 14,
      paddingVertical: 7,
    },

    levelChipText: {
      fontSize: 11,
      fontWeight: "800",
      letterSpacing: 1,
    },

    addButton: {
      flexDirection: "row",
      alignItems: "center",
      gap: 4,
      backgroundColor:
        colors.wings,
      borderRadius: 10,
      paddingLeft: 10,
      paddingRight: 14,
      paddingVertical: 8,
    },

    addButtonDisabled: {
      opacity: 0.35,
    },

    addButtonText: {
      color: colors.text,
      fontSize: 12,
      fontWeight: "800",
      letterSpacing: 1,
    },

    clearButton: {
      alignSelf: "flex-end",
      marginTop: 12,
    },

    clearButtonText: {
      color: colors.textSecondary,
      fontSize: 10,
      fontWeight: "700",
      letterSpacing: 1.2,
    },

    emptyText: {
      color: colors.muted,
      fontSize: 13,
      textAlign: "center",
      paddingVertical: 24,
    },

    itemRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
      marginTop: 10,
      backgroundColor:
        colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 12,
      padding: 12,
    },

    itemRowOrdered: {
      opacity: 0.55,
    },

    checkbox: {
      width: 24,
      height: 24,
      alignItems: "center",
      justifyContent: "center",
      borderWidth: 1.5,
      borderColor:
        colors.borderLight,
      borderRadius: 7,
    },

    checkboxChecked: {
      backgroundColor:
        colors.green,
      borderColor: colors.green,
    },

    itemBody: {
      flex: 1,
    },

    itemName: {
      color: colors.text,
      fontSize: 15,
      fontWeight: "700",
    },

    itemNameOrdered: {
      textDecorationLine:
        "line-through",
    },

    itemNote: {
      color: colors.textSecondary,
      fontSize: 12,
      marginTop: 2,
    },

    itemMeta: {
      color: colors.muted,
      fontSize: 10,
      fontWeight: "600",
      letterSpacing: 0.5,
      marginTop: 5,
    },

    levelBadge: {
      borderWidth: 1,
      borderRadius: 6,
      paddingHorizontal: 8,
      paddingVertical: 3,
    },

    levelBadgeText: {
      fontSize: 10,
      fontWeight: "800",
      letterSpacing: 1,
    },
  });
