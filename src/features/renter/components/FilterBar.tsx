import React, { useState } from "react";
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  Modal,
  ScrollView,
} from "react-native";
import { Filters, SortBy } from "../utils/types";
import { colors, sizes } from "../../../styles/globalStyles";
import {
  LISTING_LEASE_LENGTHS,
  PROPERTY_TYPES,
} from "../../shared/listingSchema";

export default function FilterBar({
  filters,
  setFilters,
}: {
  filters: Filters;
  setFilters: React.Dispatch<React.SetStateAction<Filters>>;
}) {
  const [open, setOpen] = useState(false);
  const sortMode: SortBy = filters.sortBy ?? "relevance";

  const hasFilters =
    filters.bedrooms ||
    filters.propertyType ||
    filters.leaseLength ||
    (filters.sortBy && filters.sortBy !== "relevance");

  return (
    <>
      {/* TOP BAR */}
      <View style={styles.topBar}>
        <Pressable style={styles.filterBtn} onPress={() => setOpen(true)}>
          <Text style={styles.filterText}>Filters</Text>
        </Pressable>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.activeRow}
        >
          {filters.sortBy && filters.sortBy !== "relevance" && (
            <View style={styles.pill}>
              <Text style={styles.pillText}>{filters.sortBy}</Text>
            </View>
          )}

          {filters.bedrooms && (
            <View style={styles.pill}>
              <Text style={styles.pillText}>{filters.bedrooms}BR</Text>
            </View>
          )}

          {filters.propertyType && (
            <View style={styles.pill}>
              <Text style={styles.pillText}>{filters.propertyType}</Text>
            </View>
          )}

          {filters.leaseLength && (
            <View style={styles.pill}>
              <Text style={styles.pillText}>{filters.leaseLength}</Text>
            </View>
          )}
        </ScrollView>

        {/* RESET (OUTSIDE MODAL) */}
        {hasFilters && (
          <Pressable
            style={styles.resetBtn}
            onPress={() =>
              setFilters({
                bedrooms: null,
                furnished: null,
                propertyType: null,
                leaseLength: null,
                sortBy: "relevance",
              })
            }
          >
            <Text style={styles.resetText}>Clear</Text>
          </Pressable>
        )}
      </View>

      {/* MODAL */}
      <Modal visible={open} animationType="slide">
        <View style={styles.modal}>
          <Text style={styles.title}>Filters</Text>

          <ScrollView contentContainerStyle={styles.modalContent}>
            {/* SORT */}
            <Text style={styles.section}>Sort</Text>

            <Pressable
              style={[
                styles.option,
                sortMode === "price" && styles.active,
              ]}
              onPress={() =>
                setFilters((p) => ({
                  ...p,
                  sortBy: p.sortBy === "price" ? "relevance" : "price",
                }))
              }
            >
              <Text style={styles.optionText}>Price</Text>
            </Pressable>

            <Pressable
              style={[
                styles.option,
                sortMode === "distance" && styles.active,
              ]}
              onPress={() =>
                setFilters((p) => ({
                  ...p,
                  sortBy: p.sortBy === "distance" ? "relevance" : "distance",
                }))
              }
            >
              <Text style={styles.optionText}>Distance</Text>
            </Pressable>

            {/* BEDROOMS */}
            <Text style={styles.section}>Bedrooms</Text>
            {[1, 2, 3].map((b) => (
              <Pressable
                key={b}
                style={[
                  styles.option,
                  filters.bedrooms === b && styles.active,
                ]}
                onPress={() =>
                  setFilters((p) => ({
                    ...p,
                    bedrooms: p.bedrooms === b ? null : b,
                  }))
                }
              >
                <Text style={styles.optionText}>{b}BR</Text>
              </Pressable>
            ))}

            {/* PROPERTY TYPE */}
            <Text style={styles.section}>Property Type</Text>
            {PROPERTY_TYPES.map((t) => (
              <Pressable
                key={t}
                style={[
                  styles.option,
                  filters.propertyType === t && styles.active,
                ]}
                onPress={() =>
                  setFilters((p) => ({
                    ...p,
                    propertyType: p.propertyType === t ? null : t,
                  }))
                }
              >
                <Text style={styles.optionText}>{t}</Text>
              </Pressable>
            ))}

            {/* LEASE */}
            <Text style={styles.section}>Lease Length</Text>
            {LISTING_LEASE_LENGTHS.map((l) => (
              <Pressable
                key={l}
                style={[
                  styles.option,
                  filters.leaseLength === l && styles.active,
                ]}
                onPress={() =>
                  setFilters((p) => ({
                    ...p,
                    leaseLength: p.leaseLength === l ? null : l,
                  }))
                }
              >
                <Text style={styles.optionText}>{l}</Text>
              </Pressable>
            ))}
          </ScrollView>

          <Pressable style={styles.done} onPress={() => setOpen(false)}>
            <Text style={styles.doneText}>Done</Text>
          </Pressable>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    marginBottom: 6,
  },

  filterBtn: {
    backgroundColor: colors.deepPurple,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 999,
    marginRight: 10,
  },

  filterText: {
    color: colors.white,
    fontSize: sizes.small,
    fontWeight: "600",
  },

  activeRow: {
    flexDirection: "row",
    gap: 6,
  },

  pill: {
    backgroundColor: colors.lightBlueAccent,
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 999,
  },

  pillText: {
    fontSize: sizes.small,
    color: colors.deepPurple,
    fontWeight: "600",
  },

  resetBtn: {
    marginLeft: 8,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 999,
    backgroundColor: colors.lightBlueAccent,
  },

  resetText: {
    color: colors.deepPurple,
    fontSize: sizes.small,
    fontWeight: "600",
  },

  modal: {
    flex: 1,
    paddingTop: 60,
    backgroundColor: colors.white,
  },

  title: {
    fontSize: sizes.large,
    fontWeight: "700",
    paddingHorizontal: 16,
    marginBottom: 10,
    color: colors.black,
  },

  modalContent: {
    paddingHorizontal: 16,
    paddingBottom: 40,
  },

  section: {
    marginTop: 16,
    marginBottom: 6,
    fontWeight: "700",
    color: colors.textSecondary,
  },

  option: {
    padding: 12,
    backgroundColor: "#F3F4F6",
    borderRadius: 12,
    marginBottom: 8,
  },

  optionText: {
    color: colors.black,
    fontSize: sizes.small,
  },

  active: {
    backgroundColor: colors.lightBlueAccent,
    borderColor: colors.deepPurple,
    borderWidth: 1,
  },

  done: {
    backgroundColor: colors.deepPurple,
    padding: 14,
    alignItems: "center",
  },

  doneText: {
    color: colors.white,
    fontWeight: "700",
  },
});
